
class LPCAssetMapper {
    constructor() {
        this.baseUrl = '/lpc-generator/spritesheets/';
        this.allPaths = new Set();
        this.fileTree = {};
        // This promise resolves when initialization is complete.
        this.ready = this.initialize();
    }

    async initialize() {
        try {
            console.log('🔄 Fetching LPC generator HTML...');
            
            // 1. Fetch index.html
            const response = await fetch('/lpc-generator/index.html');
            if (!response.ok) {
                throw new Error(`Failed to fetch LPC generator: ${response.status}`);
            }
            
            const htmlContent = await response.text();
            console.log('✅ HTML content fetched successfully');
            
            // 2. Parse with DOMParser
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            // 3. Extract all paths from 'data-layer_' attributes
            console.log('🔍 Extracting sprite paths...');
            const allElements = doc.querySelectorAll('*');
            let pathCount = 0;
            
            allElements.forEach(element => {
                const attributes = Array.from(element.attributes);
                attributes.forEach(attr => {
                    if (attr.name.startsWith('data-layer_') && attr.value && attr.value.includes('.png')) {
                        // Clean up the path value
                        let cleanPath = attr.value.replace(/^["']|["']$/g, ''); // Remove quotes
                        
                        // Ensure path starts with the base URL
                        if (!cleanPath.startsWith('/lpc-generator/spritesheets/')) {
                            if (cleanPath.startsWith('/lpc-generator/')) {
                                // Path is already properly formatted
                            } else if (cleanPath.startsWith('spritesheets/')) {
                                cleanPath = '/lpc-generator/' + cleanPath;
                            } else {
                                cleanPath = '/lpc-generator/spritesheets/' + cleanPath;
                            }
                        }
                        
                        this.allPaths.add(cleanPath);
                        pathCount++;
                    }
                });
            });
            
            console.log(`📊 Found ${this.allPaths.size} unique sprite paths from ${pathCount} total references`);
            
            // 4. Build the file tree
            this.buildTree();
            
            console.log('✅ LPCAssetMapper initialization complete');
            
        } catch (error) {
            console.error('❌ Failed to initialize LPCAssetMapper:', error);
            throw error;
        }
    }

    buildTree() {
        console.log('🌳 Building file tree structure...');
        this.fileTree = {};
        
        this.allPaths.forEach(fullPath => {
            // Remove the base path to get relative path
            let relativePath = fullPath.replace('/lpc-generator/spritesheets/', '');
            
            // Split the path into parts
            const parts = relativePath.split('/');
            
            // Navigate/create the tree structure
            let currentLevel = this.fileTree;
            
            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    // This is a file (ends with .png)
                    currentLevel[part] = {
                        _fullPath: fullPath,
                        _isFile: true
                    };
                } else {
                    // This is a directory
                    if (!currentLevel[part]) {
                        currentLevel[part] = {};
                    }
                    currentLevel = currentLevel[part];
                }
            });
        });
        
        console.log('✅ File tree built successfully');
    }

    // Public method to get the flat list of all paths
    getAllPaths() {
        return Array.from(this.allPaths);
    }

    // Public method to get the structured file tree
    getFileTree() {
        return this.fileTree;
    }

    // Method to get statistics about the mapped assets
    getStats() {
        const paths = this.getAllPaths();
        const stats = {
            totalPaths: paths.length,
            categories: {},
            animations: {},
            bodyTypes: {}
        };

        paths.forEach(path => {
            // Extract category (first directory after spritesheets)
            const match = path.match(/\/spritesheets\/([^\/]+)\//);
            if (match) {
                const category = match[1];
                stats.categories[category] = (stats.categories[category] || 0) + 1;
            }

            // Extract animation (filename without extension)
            const filename = path.split('/').pop();
            if (filename) {
                const animation = filename.replace('.png', '');
                stats.animations[animation] = (stats.animations[animation] || 0) + 1;
            }

            // Extract body types
            if (path.includes('/male/')) {
                stats.bodyTypes.male = (stats.bodyTypes.male || 0) + 1;
            }
            if (path.includes('/female/')) {
                stats.bodyTypes.female = (stats.bodyTypes.female || 0) + 1;
            }
            if (path.includes('/child/')) {
                stats.bodyTypes.child = (stats.bodyTypes.child || 0) + 1;
            }
            if (path.includes('/teen/')) {
                stats.bodyTypes.teen = (stats.bodyTypes.teen || 0) + 1;
            }
        });

        return stats;
    }

    // Method to export results as downloadable files
    exportResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Export complete file tree
        const treeData = {
            metadata: {
                timestamp: new Date().toISOString(),
                totalPaths: this.allPaths.size,
                source: 'LPCAssetMapper',
                baseUrl: this.baseUrl
            },
            stats: this.getStats(),
            fileTree: this.getFileTree(),
            allPaths: this.getAllPaths()
        };
        
        this.downloadFile(`lpc-asset-map_${timestamp}.json`, JSON.stringify(treeData, null, 2), 'application/json');
        
        // Export flat list as CSV
        const csvData = this.createCSV();
        this.downloadFile(`lpc-asset-paths_${timestamp}.csv`, csvData, 'text/csv');
        
        // Export summary report
        const summaryReport = this.createSummaryReport();
        this.downloadFile(`lpc-asset-summary_${timestamp}.txt`, summaryReport, 'text/plain');
        
        console.log('📁 Results exported successfully');
    }

    createCSV() {
        const headers = ['Full Path', 'Category', 'Filename', 'Animation', 'Body Type'];
        const rows = [headers.join(',')];
        
        this.getAllPaths().forEach(path => {
            const parts = path.split('/');
            const filename = parts[parts.length - 1];
            const animation = filename.replace('.png', '');
            
            // Extract category
            const categoryMatch = path.match(/\/spritesheets\/([^\/]+)\//);
            const category = categoryMatch ? categoryMatch[1] : 'unknown';
            
            // Extract body type
            let bodyType = 'unknown';
            if (path.includes('/male/')) bodyType = 'male';
            else if (path.includes('/female/')) bodyType = 'female';
            else if (path.includes('/child/')) bodyType = 'child';
            else if (path.includes('/teen/')) bodyType = 'teen';
            else if (path.includes('/adult/')) bodyType = 'adult';
            
            const row = [
                `"${path}"`,
                `"${category}"`,
                `"${filename}"`,
                `"${animation}"`,
                `"${bodyType}"`
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    createSummaryReport() {
        const stats = this.getStats();
        let report = `LPC ASSET MAPPER SUMMARY REPORT\n`;
        report += `Generated: ${new Date().toISOString()}\n`;
        report += `${'='.repeat(50)}\n\n`;
        
        report += `OVERVIEW:\n`;
        report += `Total unique sprite paths: ${stats.totalPaths}\n`;
        report += `Base URL: ${this.baseUrl}\n\n`;
        
        report += `CATEGORIES:\n`;
        Object.entries(stats.categories)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, count]) => {
                report += `${category}: ${count} sprites\n`;
            });
        
        report += `\nANIMATIONS:\n`;
        Object.entries(stats.animations)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20) // Top 20 animations
            .forEach(([animation, count]) => {
                report += `${animation}: ${count} occurrences\n`;
            });
        
        report += `\nBODY TYPES:\n`;
        Object.entries(stats.bodyTypes)
            .sort(([,a], [,b]) => b - a)
            .forEach(([bodyType, count]) => {
                report += `${bodyType}: ${count} sprites\n`;
            });
        
        return report;
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

// Make available globally
if (typeof window !== 'undefined') {
    window.LPCAssetMapper = LPCAssetMapper;
}
