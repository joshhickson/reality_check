
// LPC Complete Directory Scanner - Maps entire file tree through recursive exploration
class LPCCompleteScanner {
    constructor() {
        this.completeFileTree = new Map();
        this.discoveredFiles = [];
        this.directoriesScanned = new Set();
        this.totalFilesFound = 0;
        this.totalDirectoriesFound = 0;
        this.scanDepth = 0;
        this.maxDepth = 15; // Safety limit
        this.scanResults = {
            fileTree: {},
            pathsByCategory: {},
            allValidPaths: [],
            directoryStructure: {},
            fileExtensions: {},
            scanStatistics: {}
        };
    }

    async scanCompleteFileTree() {
        console.log('🌳 Starting complete LPC directory tree scan...');
        
        try {
            // Start recursive scan from root
            await this.recursiveScan('/lpc-generator/spritesheets');
            
            // Process discovered files
            this.processDiscoveredFiles();
            
            // Generate comprehensive report
            const report = this.generateCompleteReport();
            
            console.log('🎉 Complete scan finished!');
            console.log(`📊 Found ${this.totalFilesFound} files in ${this.totalDirectoriesFound} directories`);
            
            return report;

        } catch (error) {
            console.error('❌ Complete scan failed:', error);
            throw error;
        }
    }

    async recursiveScan(currentPath, depth = 0) {
        if (depth > this.maxDepth) {
            console.warn(`⚠️ Max depth reached at ${currentPath}`);
            return;
        }

        if (this.directoriesScanned.has(currentPath)) {
            return; // Already scanned
        }

        console.log(`${'  '.repeat(depth)}🔍 Scanning: ${currentPath}`);
        this.directoriesScanned.add(currentPath);
        this.totalDirectoriesFound++;

        try {
            // Try to get directory listing by testing known subdirectory patterns
            const subdirectories = await this.discoverSubdirectories(currentPath);
            const files = await this.discoverFiles(currentPath);

            // Record this directory
            this.completeFileTree.set(currentPath, {
                subdirectories,
                files,
                depth,
                scannedAt: new Date().toISOString()
            });

            // Recursively scan subdirectories
            for (const subdir of subdirectories) {
                const fullSubdirPath = `${currentPath}/${subdir}`;
                await this.recursiveScan(fullSubdirPath, depth + 1);
            }

            // Record files
            for (const file of files) {
                const fullFilePath = `${currentPath}/${file}`;
                this.discoveredFiles.push({
                    path: fullFilePath,
                    directory: currentPath,
                    filename: file,
                    depth,
                    extension: this.getFileExtension(file)
                });
                this.totalFilesFound++;
            }

        } catch (error) {
            console.log(`${'  '.repeat(depth)}❌ Error scanning ${currentPath}:`, error.message);
        }
    }

    async discoverSubdirectories(parentPath) {
        const commonSubdirectories = [
            'male', 'female', 'child', 'teen', 'adult', 'muscular', 'pregnant',
            'hurt', 'walk', 'idle', 'run', 'shoot', 'slash', 'spellcast', 'thrust',
            'backslash', 'climb', 'combat_idle', 'emote', 'halfslash', 'jump', 'sit',
            'bodies', 'hair', 'torso', 'legs', 'arms', 'feet', 'head', 'eyes',
            'clothes', 'armor', 'armour', 'weapons', 'accessories', 'bg', 'fg',
            'basic', 'formal', 'casual', 'leather', 'cloth', 'metal', 'plate',
            'page', 'plain', 'ponytail', 'long', 'short', 'curly', 'straight',
            'pants', 'shorts', 'skirts', 'dress', 'shirt', 'blouse', 'vest',
            'boots', 'shoes', 'sandals', 'gloves', 'bracers', 'helmet', 'hat',
            'beard', 'mustache', 'glasses', 'earrings', 'necklace', 'cape',
            'longsleeve', 'formal_striped', 'laced', 'thin', 'thick'
        ];

        const foundSubdirectories = [];

        for (const subdir of commonSubdirectories) {
            const testPath = `${parentPath}/${subdir}`;
            if (await this.pathExists(testPath)) {
                foundSubdirectories.push(subdir);
            }
        }

        // Also try some pattern-based discovery
        const patterns = [
            // Color patterns
            'black', 'blue', 'brown', 'blonde', 'red', 'green', 'white', 'gray',
            // Style patterns
            'bangs', 'bob', 'braid', 'buzz', 'pixie', 'afro', 'dread',
            // Size patterns
            'small', 'medium', 'large', 'xl', 'xxl'
        ];

        for (const pattern of patterns) {
            const testPath = `${parentPath}/${pattern}`;
            if (await this.pathExists(testPath)) {
                foundSubdirectories.push(pattern);
            }
        }

        return foundSubdirectories;
    }

    async discoverFiles(directoryPath) {
        const commonFilenames = [
            // Animation files
            'walk.png', 'hurt.png', 'idle.png', 'run.png', 'shoot.png', 
            'slash.png', 'spellcast.png', 'thrust.png', 'backslash.png',
            'climb.png', 'combat_idle.png', 'emote.png', 'halfslash.png',
            'jump.png', 'sit.png',
            // Color variant files
            'black.png', 'blue.png', 'brown.png', 'blonde.png', 'red.png',
            'green.png', 'white.png', 'gray.png', 'grey.png',
            // Special files
            'bg.png', 'fg.png', 'base.png', 'overlay.png', 'shadow.png'
        ];

        const foundFiles = [];

        for (const filename of commonFilenames) {
            const testPath = `${directoryPath}/${filename}`;
            if (await this.fileExists(testPath)) {
                foundFiles.push(filename);
            }
        }

        return foundFiles;
    }

    async pathExists(path) {
        try {
            const response = await fetch(path, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async fileExists(path) {
        try {
            const response = await fetch(path, { method: 'HEAD' });
            return response.ok && response.headers.get('content-type')?.includes('image');
        } catch (error) {
            return false;
        }
    }

    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    }

    processDiscoveredFiles() {
        console.log('📝 Processing discovered files...');

        // Categorize files
        this.scanResults.pathsByCategory = {
            body: [],
            hair: [],
            torso: [],
            legs: [],
            arms: [],
            feet: [],
            head: [],
            eyes: [],
            accessories: [],
            other: []
        };

        // Extension statistics
        this.scanResults.fileExtensions = {};

        for (const file of this.discoveredFiles) {
            // Categorize by path
            const category = this.categorizeFile(file.path);
            if (this.scanResults.pathsByCategory[category]) {
                this.scanResults.pathsByCategory[category].push(file);
            } else {
                this.scanResults.pathsByCategory.other.push(file);
            }

            // Count extensions
            const ext = file.extension;
            this.scanResults.fileExtensions[ext] = (this.scanResults.fileExtensions[ext] || 0) + 1;

            // Add to all valid paths
            this.scanResults.allValidPaths.push(file.path);
        }
    }

    categorizeFile(filePath) {
        const path = filePath.toLowerCase();
        
        if (path.includes('/body/')) return 'body';
        if (path.includes('/hair/')) return 'hair';
        if (path.includes('/torso/')) return 'torso';
        if (path.includes('/legs/')) return 'legs';
        if (path.includes('/arms/')) return 'arms';
        if (path.includes('/feet/')) return 'feet';
        if (path.includes('/head/')) return 'head';
        if (path.includes('/eyes/')) return 'eyes';
        if (path.includes('/accessories/') || path.includes('/facial/')) return 'accessories';
        
        return 'other';
    }

    generateCompleteReport() {
        // Convert file tree map to object
        this.scanResults.fileTree = {};
        for (const [path, data] of this.completeFileTree) {
            this.scanResults.fileTree[path] = data;
        }

        // Generate directory structure
        this.scanResults.directoryStructure = this.buildDirectoryTree();

        // Statistics
        this.scanResults.scanStatistics = {
            totalFiles: this.totalFilesFound,
            totalDirectories: this.totalDirectoriesFound,
            maxDepthReached: this.scanDepth,
            directoriesScanned: this.directoriesScanned.size,
            categoriesFound: Object.keys(this.scanResults.pathsByCategory).filter(
                cat => this.scanResults.pathsByCategory[cat].length > 0
            ).length,
            filesByExtension: this.scanResults.fileExtensions,
            scanDuration: new Date().toISOString()
        };

        return this.scanResults;
    }

    buildDirectoryTree() {
        const tree = {};
        
        for (const [path, data] of this.completeFileTree) {
            const pathParts = path.split('/').filter(p => p);
            let current = tree;
            
            for (const part of pathParts) {
                if (!current[part]) {
                    current[part] = {
                        subdirectories: {},
                        files: []
                    };
                }
                current = current[part].subdirectories;
            }
            
            // Add files to the final directory
            if (data.files && data.files.length > 0) {
                const finalDir = this.getDeepestObject(tree, pathParts);
                finalDir.files = data.files;
            }
        }
        
        return tree;
    }

    getDeepestObject(obj, pathParts) {
        let current = obj;
        for (const part of pathParts) {
            current = current[part].subdirectories;
        }
        return current;
    }

    exportCompleteResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Export comprehensive JSON
        const jsonContent = JSON.stringify(this.scanResults, null, 2);
        this.downloadFile(`lpc-complete-scan_${timestamp}.json`, jsonContent, 'application/json');

        // Export file list CSV
        const csvContent = this.generateFileListCSV();
        this.downloadFile(`lpc-complete-files_${timestamp}.csv`, csvContent, 'text/csv');

        // Export directory tree as text
        const treeContent = this.generateDirectoryTreeText();
        this.downloadFile(`lpc-directory-tree_${timestamp}.txt`, treeContent, 'text/plain');

        console.log('📁 Complete scan results exported successfully');
    }

    generateFileListCSV() {
        const headers = ['Path', 'Directory', 'Filename', 'Category', 'Extension', 'Depth'];
        const rows = [headers.join(',')];

        for (const file of this.discoveredFiles) {
            const category = this.categorizeFile(file.path);
            const row = [
                `"${file.path}"`,
                `"${file.directory}"`,
                `"${file.filename}"`,
                category,
                file.extension,
                file.depth
            ];
            rows.push(row.join(','));
        }

        return rows.join('\n');
    }

    generateDirectoryTreeText() {
        let content = `LPC Generator Complete Directory Tree\n`;
        content += `Generated: ${new Date().toISOString()}\n`;
        content += `Total Files: ${this.totalFilesFound}\n`;
        content += `Total Directories: ${this.totalDirectoriesFound}\n\n`;

        content += this.formatDirectoryTree(this.scanResults.directoryStructure, '', 0);
        
        return content;
    }

    formatDirectoryTree(obj, prefix = '', depth = 0) {
        let result = '';
        const entries = Object.entries(obj);
        
        for (let i = 0; i < entries.length; i++) {
            const [name, data] = entries[i];
            const isLast = i === entries.length - 1;
            const currentPrefix = isLast ? '└── ' : '├── ';
            const nextPrefix = isLast ? '    ' : '│   ';
            
            result += `${prefix}${currentPrefix}${name}/\n`;
            
            // Add files in this directory
            if (data.files && data.files.length > 0) {
                for (let j = 0; j < data.files.length; j++) {
                    const file = data.files[j];
                    const filePrefix = j === data.files.length - 1 && Object.keys(data.subdirectories).length === 0 ? '└── ' : '├── ';
                    result += `${prefix}${nextPrefix}${filePrefix}${file}\n`;
                }
            }
            
            // Recursively add subdirectories
            if (data.subdirectories && Object.keys(data.subdirectories).length > 0) {
                result += this.formatDirectoryTree(data.subdirectories, prefix + nextPrefix, depth + 1);
            }
        }
        
        return result;
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Global function to run complete scan
async function runCompleteLPCScan() {
    try {
        const scanner = new LPCCompleteScanner();
        const results = await scanner.scanCompleteFileTree();

        console.log('🎉 Complete scan finished successfully!');
        console.log(`📊 Discovered ${results.scanStatistics.totalFiles} files`);
        console.log(`📂 Scanned ${results.scanStatistics.totalDirectories} directories`);
        console.log(`🗂️ Found ${results.scanStatistics.categoriesFound} categories`);

        // Export comprehensive results
        scanner.exportCompleteResults();

        return results;

    } catch (error) {
        console.error('❌ Complete scan failed:', error);
        throw error;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.LPCCompleteScanner = LPCCompleteScanner;
    window.runCompleteLPCScan = runCompleteLPCScan;
}
