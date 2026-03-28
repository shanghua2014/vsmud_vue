# webpack_vue

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## 同类提示按钮接入规范（rematch）

适用场景：按钮由后端下行提示触发显示，点击后先隐藏，后续再次匹配成功再显示（如「确认出村」「1-4 直接」）。

前端统一使用 `src/common/promptReopenState.ts`，不要再手写一套状态机。

### 接入步骤（前端）

1. 在 `App.vue` 为该按钮准备服务端信号 `xxxSrv`，并创建状态：
   - `const xxxReopen = createHiddenUntilRematchState()`
2. 在下行事件处理函数里调用：
   - `onHiddenUntilRematchSignal(xxxReopen, v)`
3. 在按钮点击回调里调用：
   - `markHiddenUntilRematchClicked(xxxReopen, xxxSrv.value)`
4. 在显示条件中增加：
   - `!xxxReopen.hiddenAfterClick.value`
5. 在 `onMudSess` 中重置：
   - `resetHiddenUntilRematchState(xxxReopen)`

### 给 AI 的固定口令（推荐）

```text
匹配：下行含 `[1;33m你先去拜武伯`
按同类提示按钮模板接入：<拜武伯>
逻辑：点击隐藏，再次匹配恢复（rematch）
命令："walk 练武场;bai wubo"(用";"做切割，依次发送命令)
范围：前后端都改
```
