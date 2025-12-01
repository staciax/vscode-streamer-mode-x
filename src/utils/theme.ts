import fs from 'fs/promises';
import path from 'path';
import vscode from 'vscode';

// Thanks to this StackOverflow answer for guidance:
// https://stackoverflow.com/questions/66178468/vscode-api-how-to-get-icons-from-file-icon-theme

type ThemeFileData = {
    hidesExplorerArrows?: boolean;
    iconDefinitions?: Record<string, { iconPath: string }>;
    file?: string;
    folder?: string;
    folderExpanded?: string;
    fileExtensions?: Record<string, string>;
    fileNames?: Record<string, string>;
    languageIds?: Record<string, string>;
    [key: string]: any;
};

type IconThemeContribution = {
    id: string;
    path: string;
    label?: string;
};

type PackageJSON = {
    contributes?: {
        iconThemes?: IconThemeContribution[];
    };
};

type ThemeExtensionInfo = {
    extension: vscode.Extension<any>;
    themePath: string;
};

type ThemeData = ThemeFileData & {
    data: ThemeFileData;
    themeDir: string;
};

const themeCache = new Map<string, ThemeData>();

/**
 * Clears the theme cache
 */
export function clearThemeCache(): void {
    themeCache.clear();
}

/**
 * Gets the currently active icon theme ID
 */
export function getActiveIconThemeId(): string | undefined {
    return vscode.workspace
        .getConfiguration('workbench')
        .get<string>('iconTheme');
}

/**
 * Finds extension and theme path for a given theme ID
 */
function findThemeExtension(iconThemeId: string): ThemeExtensionInfo | null {
    for (const ext of vscode.extensions.all) {
        const iconThemes = (ext.packageJSON as PackageJSON).contributes
            ?.iconThemes;

        if (!iconThemes) {
            continue;
        }

        const theme = iconThemes.find((t) => t.id === iconThemeId);
        if (theme) {
            return {
                extension: ext,
                themePath: theme.path
            };
        }
    }

    return null;
}

/**
 * Loads theme data and returns both data and theme directory
 */
async function loadTheme(iconThemeId: string): Promise<ThemeData | null> {
    const themeInfo = findThemeExtension(iconThemeId);

    if (!themeInfo) {
        return null;
    }

    if (themeCache.has(iconThemeId)) {
        return themeCache.get(iconThemeId)!;
    }

    try {
        const fullThemePath = path.join(
            themeInfo.extension.extensionPath,
            themeInfo.themePath
        );
        const content = await fs.readFile(fullThemePath, 'utf-8');
        const data = JSON.parse(content) as ThemeFileData;

        const themeData = {
            data,
            themeDir: path.dirname(fullThemePath)
        };
        themeCache.set(iconThemeId, themeData);
        return themeData;
    } catch (error) {
        console.error(`Failed to load icon theme ${iconThemeId}:`, error);
        return null;
    }
}

/**
 * Gets icon theme data by theme ID
 * @param iconThemeId - Icon theme ID
 * @returns Icon theme data, or null if theme not found
 */
export async function getIconThemeData(
    iconThemeId: string
): Promise<ThemeFileData | null> {
    const theme = await loadTheme(iconThemeId);
    return theme?.data ?? null;
}

/**
 * Resolves icon definition key from theme data based on file path
 */
function resolveIconKey(
    themeData: ThemeFileData,
    filePath: string
): string | null {
    const fileName = path.basename(filePath);

    // Priority 1: Exact file name match (e.g., "package.json", ".gitignore")
    if (themeData.fileNames) {
        const iconKey = themeData.fileNames[fileName];
        if (iconKey) {
            return iconKey;
        }
    }

    // Priority 2: File extension match (e.g., "ts", "js")
    const ext = path.extname(filePath);
    if (ext) {
        const extension = ext.slice(1); // Remove leading dot
        if (themeData.fileExtensions) {
            const iconKey = themeData.fileExtensions[extension];
            if (iconKey) {
                return iconKey;
            }
        }
    }

    // Priority 3: Default file icon
    return themeData.file ?? null;
}

/**
 * Gets the icon URI for a file based on icon theme
 * @param filePath - Path to the file
 * @param iconThemeId - Optional icon theme ID. Uses active theme if not provided
 * @returns Icon URI, or null if not found
 */
export async function getFileIconUri(
    filePath: string,
    iconThemeId?: string
): Promise<vscode.Uri | null> {
    const themeId = iconThemeId ?? getActiveIconThemeId();
    if (!themeId) {
        return null;
    }

    // Load theme once - get both data and directory
    const theme = await loadTheme(themeId);
    if (!theme?.data.iconDefinitions) {
        return null;
    }

    const iconKey = resolveIconKey(theme.data, filePath);
    if (!iconKey) {
        return null;
    }

    const iconDef = theme.data.iconDefinitions[iconKey];
    if (!iconDef?.iconPath) {
        return null;
    }

    // Resolve relative icon path to absolute path
    const absoluteIconPath = path.join(theme.themeDir, iconDef.iconPath);

    return vscode.Uri.file(absoluteIconPath);
}
