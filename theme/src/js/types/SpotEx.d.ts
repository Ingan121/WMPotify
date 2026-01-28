// See <repository root>/SpotifyCrExt for the SpotEx implementation

declare namespace SpotEx {
    function openWindow(createData: chrome.windows.CreateData): Promise<chrome.windows.Window>;
    function updateWindow(updateInfo: chrome.windows.UpdateInfo): Promise<void>;
    function getWindow(getOptions?: chrome.windows.QueryOptions): Promise<chrome.windows.Window>;
    function fetch<T = any>(url: string, options: RequestInit, responseType?: "text" | "json" | "raw"): Promise<{ ok: boolean; status: number; result?: T; error?: string }>;
}