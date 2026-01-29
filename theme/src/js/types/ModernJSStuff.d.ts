// Type declaration for File System Access API which is somehow still missing
interface PickerOpts {
    types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
    }>;
    excludeAcceptAllOption?: boolean;
    multiple?: boolean;
}

interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
    write(data: BufferSource | string): Promise<void>;
    close(): Promise<void>;
}

// Ditto for Local Font Access API
interface FontData {
    family: string;
    style: string;
    weight: string;
    stretch: string;
    data: ArrayBuffer;
}

// DocumentPictureInPicture API
interface RequestWindowOpts {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
    preferInitialWindowPlacement?: boolean;
}

interface DocumentPictureInPicture {
    requestWindow(options?: RequestWindowOpts): Promise<Window>;
}

interface Window {
    showOpenFilePicker(options?: PickerOpts): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(options?: PickerOpts): Promise<FileSystemFileHandle>;
    queryLocalFonts(): Promise<FontData[]>;
    documentPictureInPicture: DocumentPictureInPicture | undefined;
}