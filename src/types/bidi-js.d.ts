declare module 'bidi-js' {
    export interface EmbeddingLevels {
        levels: Uint8Array;
        paragraphs: { start: number; end: number; level: number }[];
    }

    export default function bidiFactory(): {
        getEmbeddingLevels(text: string, direction?: string): EmbeddingLevels;
        getReorderSegments(text: string, embeddingLevels: EmbeddingLevels, start?: number, end?: number): [number, number][];
        getMirroredCharactersMap(text: string, embeddingLevels: EmbeddingLevels, start?: number, end?: number): Map<number, string>;
    };
}
