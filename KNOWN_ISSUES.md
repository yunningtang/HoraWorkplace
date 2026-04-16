# Known Issues

Running log of horosa-stack problems we've hit, with evidence and next steps.
Tracked here (instead of GitHub Issues) so the repro artifacts live next to the fix.

---

## #1 — `astro_chart` / `predict_decennials` 返回 "param error"

**Status:** open · affects horosa-skill v0.3.0 runtime
**Discovered:** 2026-04-15
**Impact:** 西占星盘、十年大运、所有经过 Python chart 服务 (8899) 的端点全部失败

### 症状

从 MCP 调 `horosa_astro_chart` / `horosa_predict_decennials` 时,返回:
```json
{
  "ok": false,
  "error": {
    "code": "tool.backend_param_error",
    "message": "Horosa backend rejected the birth parameters.",
    "details": {
      "status_code": 500,
      "body": "{\"ResultCode\": 200001, \"Result\": \"param error\"}"
    }
  }
}
```

MCP skill 提示的 "用 `+08:00` 时区、`31n14` 紧凑坐标" 都已经做了,仍然失败。

### 根因 (不是参数格式)

问题**不在参数**,在 Python chart 服务 (port 8899) 的 CherryPy 路由。真实异常被吞掉了 —
[`webchartsrv.py`](file:///C:/Users/tangy/AppData/Local/Horosa/runtime/current/Horosa-Web/astropy/websrv/webchartsrv.py) 的 `index()` 方法:

```python
except:
    traceback.print_exc()
    obj = {'err': 'param error'}   # ← 把所有异常都转成通用 param error
    return jsonpickle.encode(obj, unpicklable=False)
```

查看 `astropy.stderr.log` (完整内容见 [docs/known-issues/cherrypy-error.log](docs/known-issues/cherrypy-error.log)) 可以看到真实异常:

```
TypeError: 'WebChartSrv' object is not callable

File "cherrypy/_cpdispatch.py", line 88, in test_callable_spec
    (args, varargs, varkw, defaults) = getargspec(callable)
File "cherrypy/_cpdispatch.py", line 209, in getargspec
    return inspect.getfullargspec(callable)[:4]
TypeError: unsupported callable
```

CherryPy 的 dispatcher 调 `inspect.getfullargspec()` 失败。这是 **CherryPy 版本和 runtime Python 版本不兼容** — `inspect.getfullargspec` 在较新 Python 里对某些对象行为变了,旧版 CherryPy 没处理。

### 影响矩阵

| 端点 | 路径 | 状态 |
|---|---|---|
| `/bazi/birth` | 纯 Java 9999 | ✅ |
| `/ziwei/birth` | 纯 Java 9999 | ✅ |
| `/sixyao` | 纯 Java 9999 | ✅ |
| `/qimen` | 纯 Java 9999 | ✅ |
| `/chart` | Java → Python 8899 | ❌ |
| `/chart13` | Java → Python 8899 | ❌ |
| `/hellen_chart` | Java → Python 8899 | ❌ |
| `/guolao_chart` | Java → Python 8899 | ❌ |
| `/predict/*` | Java → Python 8899 | ❌ |
| `/germany` | Java → Python 8899 | ❌ |

即所有**西占系**工具都挂,**中国术数**全部正常。

### 修复方向

按优先级:

1. **升级 runtime 的 CherryPy** (成本最低) — 从 runtime Python site-packages 升级到 CherryPy ≥ 18.8,这个版本修了 `inspect.getfullargspec` 的兼容性问题。具体命令:
   ```powershell
   # Runtime Python
   $py = "C:\Users\tangy\AppData\Local\Horosa\runtime\current\runtime\windows\python\python.exe"
   & $py -m pip install --upgrade cherrypy
   ```
   然后重启 runtime (`uv run horosa-skill doctor` → 确认 `python_chart: reachable`)。

2. **降级 runtime Python** (不推荐) — 回到 < 3.11 的 Python,保持当前 CherryPy 版本可用。但会影响 MCP skill 本身依赖。

3. **修 horosa-skill 的错误处理** — `webchartsrv.py` 的 bare `except` 应该至少透传真实异常类型到响应里,否则这类 bug 永远看不到根因。建议向上游 horosa-skill 提 PR。

### 复现步骤

1. Runtime 已装:`uv --directory d:/Code/horosa-skill/horosa-skill run horosa-skill doctor` 应返回 `status: ready`
2. 运行 [repro 脚本](docs/known-issues/repro-chart-bug.py):
   ```bash
   cd d:/Code/horosa-skill/horosa-skill
   cp d:/Code/Hora/docs/known-issues/repro-chart-bug.py .
   uv run python repro-chart-bug.py
   ```
3. 查看 runtime stderr 日志确认真实异常:
   ```
   C:\Users\tangy\AppData\Local\Horosa\runtime\current\Horosa-Web\.horosa-local-logs\<最新时间戳>\astropy.stderr.log
   ```

### 前端临时处理 (horosa-chat)

已在 [App.tsx](horosa-chat/src/App.tsx) 的 `TABS` 常量中移除这两个 tab:
- ~~`horosa_astro_chart` (西占星盘)~~
- ~~`horosa_predict_decennials` (大运流年)~~

对应的 React 组件 (`AstroChart.tsx` / `DecennialTimeline.tsx`) 和 Zustand 状态
(`astroData` / `predictData`) 暂时保留,后端修复后取消 `TABS` 的注释即可恢复。

---
