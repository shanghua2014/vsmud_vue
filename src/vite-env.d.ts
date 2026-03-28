/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** 若设置，浏览器连接此 WebSocket 网关并由后端连 MUD TCP（站点卡片仍为游戏 host:port） */
    readonly VITE_MUD_GATEWAY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
