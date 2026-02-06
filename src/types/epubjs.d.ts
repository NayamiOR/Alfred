declare module 'epubjs' {
    export interface BookOptions {
        openAs?: string;
        encoding?: string;
        replacements?: string;
    }

    export interface RenditionOptions {
        width?: string | number;
        height?: string | number;
        ignoreClass?: string;
        manager?: string;
        view?: string;
        flow?: string;
        layout?: string;
        spread?: string;
        minSpreadWidth?: number;
        stylesheet?: string;
        resizeOnOrientationChange?: boolean;
        script?: string;
        allowScriptedContent?: boolean;
    }

    export class Book {
        constructor(url: string | ArrayBuffer, options?: BookOptions);
        renderTo(element: string | HTMLElement, options?: RenditionOptions): Rendition;
        coverUrl(): Promise<string | null>;
        destroy(): void;
        ready: Promise<void>;
        locations: Locations;
    }

    export class Rendition {
        display(target?: string): Promise<void>;
        next(): Promise<void>;
        prev(): Promise<void>;
        on(event: string, callback: (args: any) => void): void;
        destroy(): void;
    }

    export class Locations {
        generate(chars?: number): Promise<string[]>;
    }

    function ePub(url: string | ArrayBuffer, options?: BookOptions): Book;
    export default ePub;
}
