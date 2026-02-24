export const getFontKit = async () => {
    // We use @pdf-lib/fontkit for better compatibility with pdf-lib
    const fontkitModule = await import('@pdf-lib/fontkit');
    return (fontkitModule as any).default ?? fontkitModule;
};
