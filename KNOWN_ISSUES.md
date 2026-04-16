# Known Issues

Running log of horosa-stack problems we've hit, with evidence and fixes.

---

## #1 — `astro_chart` / `predict_decennials` "param error" ✅ 已修复

**Status:** **Resolved** (2026-04-16) · affects horosa-skill v0.3.0 runtime
**Root cause:** pyswisseph 2.10.03 `set_ephe_path` 是**线程局部**的
**Fix:** 给 `webchartsrv.py` 加 CherryPy `before_handler` hook,每个请求入口重新调用 setPath

### 排查过程

最初以为是参数格式 / CherryPy 版本问题,实际追到真正根因:

1. **假线索 1 — "param error"**
   MCP 返回 `Horosa backend rejected the birth parameters`,提示检查时区/坐标格式。但格式都对。

2. **假线索 2 — CherryPy `'WebChartSrv' object is not callable`**
   `astropy.stderr.log` 里看到 CherryPy `inspect.getfullargspec` 报错,以为是 CherryPy 版本不兼容。实际是用 GET 请求探测根端点触发的无关噪音,不是 MCP 调用真实错误。

3. **真线索 — 查 POST 请求对应的 stderr**
   当发一个有 JSON body 的 POST 请求后,日志里出现:
   ```
   swisseph.Error: swisseph.calc_ut: SwissEph file 'seas_18.se1' not found in PATH '\sweph\ephe\'
   ```
   路径 `\sweph\ephe\` 是 SwissEph 的**默认 fallback 路径**,说明 `set_ephe_path()` 从未在当前调用线程被调用过。

4. **确认是线程局部**
   ```python
   # Main thread — works
   PerChart({...})   # MAIN OK

   # Worker thread — fails
   threading.Thread(target=lambda: PerChart({...})).start()
   # WORKER ERR: SwissEph file 'seas_18.se1' not found in PATH '\sweph\ephe\'
   ```
   Warmup 在主线程成功,但 CherryPy worker thread pool 里的线程没走过 `flatlib.ephem.__init__`,`set_ephe_path` 从未在那些线程上调用。

### 修复

在 [`webchartsrv.py`](docs/known-issues/webchartsrv-patched.py) 里加:

```python
# 顶部 import 后
import flatlib
from flatlib.ephem import swe as _flatlib_swe
_SWEFILES_PATH = flatlib.PATH_RES + 'swefiles'

def _ensure_ephe_path():
    try:
        _flatlib_swe.setPath(_SWEFILES_PATH)
    except Exception:
        pass
```

然后在 `__main__` 块里挂 CherryPy 全局 hook:

```python
cherrypy.tools.ensure_ephe = cherrypy.Tool(
    'before_handler', lambda: _ensure_ephe_path()
)
cherrypy.config.update({'tools.ensure_ephe.on': True})
```

这样**所有**挂在 8899 的端点(`/chart`, `/predict/*`, `/india/*`, `/germany/*`, `/jieqi/*` 等)都在请求入口自动 setPath,线程池里哪个 worker 接到请求都能正确初始化。

### 验证

```bash
# 之前
curl ... /chart                    # ← {"err": "param error"}

# patch 之后
curl ... /chart                    # ← 完整星盘 JSON (objects/houses/aspects/...)
curl ... /predict/decennials       # ← 完整 timeline 数据
```

MCP 侧两个工具都恢复 `ok: true`,horosa-chat 的「西占星盘」和「大运流年」两个 tab 重新上架。

### 应用补丁

完整 patched 版本见 [docs/known-issues/webchartsrv-patched.py](docs/known-issues/webchartsrv-patched.py)。

覆盖到 runtime:
```powershell
Copy-Item -Force `
  "d:\Code\Hora\docs\known-issues\webchartsrv-patched.py" `
  "C:\Users\tangy\AppData\Local\Horosa\runtime\current\Horosa-Web\astropy\websrv\webchartsrv.py"

# 重启 chart 服务
Get-Process python | Where-Object {$_.Id -eq (Get-Content "...\.horosa_py.pid")} | Stop-Process
& "C:\Users\tangy\AppData\Local\Horosa\runtime\current\Horosa-Web\start_horosa_local.ps1"
```

### 应向上游报的改进

1. **pyswisseph 的 `set_ephe_path` 应该是 process-global 而不是 thread-local** —
   这是 C 库层面的设计问题,需要给 pyswisseph 提 upstream issue。
2. **horosa-skill 的 runtime 应在启动时自动 patch** — 目前的
   `webchartsrv.py` 假设了 `set_ephe_path` 全局生效,在 pyswisseph 2.10.x 线程模型下失效。
3. **`webchartsrv.py` 的 bare `except`** — 吞掉真实异常只返回 `{"err": "param error"}`,
   这个 bug 的诊断走了不少弯路。建议上游 PR 改成
   `return {"err": str(e), "type": type(e).__name__}`,或至少 log 到专门位置。

### 日志位置

```
C:\Users\tangy\AppData\Local\Horosa\runtime\current\Horosa-Web\.horosa-local-logs\<latest>\astropy.stderr.log
```

初始真实 traceback 存档: [docs/known-issues/cherrypy-error.log](docs/known-issues/cherrypy-error.log)
(其中大部分是 GET 探测引发的无关 CherryPy 报错,关键是最末尾的 `swisseph.Error`)

---
