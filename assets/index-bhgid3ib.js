import { GoogleGenAI } from "@google/genai";

// --- Constants ---
const STORAGE_KEY = "jmafk_project_data_v2";
const API_KEY_STORAGE = "jmafk_api_key";

const DEFAULT_MANIFEST = {
    format_version: 2,
    header: {
        name: "New Pack",
        description: "Created with JMAFK Maker",
        uuid: crypto.randomUUID(),
        version: [1, 0, 0],
        min_engine_version: [1, 21, 0]
    },
    modules: [
        { type: "data", uuid: crypto.randomUUID(), version: [1, 0, 0] },
        { type: "script", uuid: crypto.randomUUID(), version: [1, 0, 0], entry: "scripts/main.js" }
    ],
    dependencies: [
        { module_name: "@minecraft/server", version: "2.4.0-beta" },
        { module_name: "@minecraft/server-ui", version: "2.1.0-beta" }
    ]
};

const DEFAULT_SCRIPT = `import { world, system } from "@minecraft/server";

world.afterEvents.worldLoad.subscribe(() => {
    console.warn("Hello from JMAFK Maker!");
});`;

// --- Main App Logic ---
const app = {
    state: {
        view: "hub",
        files: [],
        config: JSON.parse(JSON.stringify(DEFAULT_MANIFEST)),
        selectedFile: null,
        mobileTab: "files",
        hubData: [],
        currentPost: null
    },

    async init() {
        await this.persistence.load();
        this.bindEvents();

        // Initialize default files if empty
        if (this.state.files.length === 0) {
            this.files.add("manifest.json", JSON.stringify(this.state.config, null, 2));
            this.files.add("scripts/main.js", DEFAULT_SCRIPT);
        }

        this.router.render();
        if (this.state.view === "hub") this.hub.init();
        this.settings.checkStatus();
    },

    bindEvents() {
        // Mobile Menu Toggle
        const toggleMenu = () => {
            const menu = document.getElementById("mobile-menu");
            const overlay = document.getElementById("mobile-overlay");
            const isClosed = menu.classList.contains("menu-closed");
            menu.classList.toggle("menu-closed", !isClosed);
            menu.classList.toggle("menu-open", isClosed);
            overlay.classList.toggle("hidden", !isClosed);
        };
        document.getElementById("hamburger-btn")?.addEventListener("click", toggleMenu);
        document.getElementById("close-menu-btn")?.addEventListener("click", toggleMenu);
        document.getElementById("mobile-overlay")?.addEventListener("click", toggleMenu);

        // Code Editor Input
        document.getElementById("code-editor")?.addEventListener("input", (e) => {
            if (this.state.selectedFile) {
                this.files.update(this.state.selectedFile, e.target.value);
            }
        });

        // Import File
        document.getElementById("import-file")?.addEventListener("change", (e) => this.import.handle(e));
        
        // AI Prompt Key Handling
        document.getElementById("ai-prompt")?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.ai.generateCode();
        });
    },

    router: {
        go(viewName) {
            // Hide all views
            document.querySelectorAll(".view-section").forEach(el => el.classList.add("hidden"));
            // Show target view
            const target = document.getElementById(`view-${viewName}`);
            if (target) target.classList.remove("hidden");
            
            app.state.view = viewName;
            if (viewName === "workspace") app.files.renderList();
        },
        render() {
            this.go(app.state.view);
        }
    },

    persistence: {
        save() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                files: app.state.files,
                config: app.state.config
            }));
        },
        load() {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                app.state.files = parsed.files || [];
                app.state.config = parsed.config || DEFAULT_MANIFEST;
            }
        }
    },

    files: {
        add(path, content) {
            const existing = app.state.files.find(f => f.path === path);
            if (existing) {
                existing.content = content;
            } else {
                app.state.files.push({ path, content });
            }
            app.persistence.save();
            this.renderList();
        },
        update(path, content) {
            const file = app.state.files.find(f => f.path === path);
            if (file) {
                file.content = content;
                app.persistence.save();
            }
        },
        select(path) {
            app.state.selectedFile = path;
            const file = app.state.files.find(f => f.path === path);
            const editor = document.getElementById("code-editor");
            const label = document.getElementById("current-file-label");
            
            if (file && label && editor) {
                label.innerText = file.path;
                editor.value = file.content;
            }
            this.renderList();
        },
        delete(path) {
            if (confirm(`Delete ${path}?`)) {
                app.state.files = app.state.files.filter(f => f.path !== path);
                if (app.state.selectedFile === path) {
                    app.state.selectedFile = null;
                    document.getElementById("code-editor").value = "";
                }
                app.persistence.save();
                this.renderList();
            }
        },
        renderList() {
            const list = document.getElementById("file-list");
            if (!list) return;
            
            list.innerHTML = "";
            app.state.files.sort((a, b) => a.path.localeCompare(b.path)).forEach(file => {
                const div = document.createElement("div");
                const isSelected = app.state.selectedFile === file.path;
                div.className = `p-2 text-sm cursor-pointer hover:bg-white/10 rounded flex justify-between group ${isSelected ? "bg-primary text-white" : "text-gray-400"}`;
                div.innerHTML = `<span>${file.path}</span> <span class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-200 px-2">×</span>`;
                div.onclick = (e) => {
                    if (e.target.innerText === "×") {
                        this.delete(file.path);
                    } else {
                        this.select(file.path);
                    }
                };
                list.appendChild(div);
            });
        }
    },

    settings: {
        getKey() { return localStorage.getItem(API_KEY_STORAGE); },
        setKey() {
            const key = prompt("Enter your Google Gemini API Key:");
            if (key) {
                localStorage.setItem(API_KEY_STORAGE, key);
                this.checkStatus();
            }
        },
        clearKey() {
            localStorage.removeItem(API_KEY_STORAGE);
            this.checkStatus();
        },
        checkStatus() {
            const display = document.getElementById("api-status-display");
            if (!display) return;
            if (this.getKey()) {
                display.innerText = "Active";
                display.className = "text-sm font-mono font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded";
            } else {
                display.innerText = "Not Configured";
                display.className = "text-sm font-mono font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded";
            }
        }
    },

    ai: {
        async getClient() {
            const key = app.settings.getKey();
            if (!key) throw new Error("API Key missing. Please set it in Settings.");
            return new GoogleGenAI({ apiKey: key });
        },
        async generateCode() {
            const promptInput = document.getElementById("ai-prompt");
            const statusEl = document.getElementById("ai-status");
            const request = promptInput.value.trim();
            if (!request) return;

            try {
                statusEl.classList.remove("hidden");
                statusEl.innerText = "Gemini is thinking...";
                
                const client = await this.getClient();
                const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

                // Construct context from current files
                const currentFile = app.state.selectedFile;
                const fileContent = app.state.files.find(f => f.path === currentFile)?.content || "";
                
                const prompt = `
                You are a Minecraft Bedrock Expert.
                Current File: ${currentFile || "None"}
                Content:
                ${fileContent}

                User Request: ${request}

                Provide ONLY the code content for the file. No markdown, no explanations.
                If creating a new file, start with ">>> CREATE: path/to/file".
                `;

                const result = await model.generateContent(prompt);
                const response = result.response.text();

                // Simple parsing logic
                if (response.includes(">>> CREATE:")) {
                    const parts = response.split("\n");
                    const pathLine = parts.find(l => l.startsWith(">>> CREATE:"));
                    const newPath = pathLine.replace(">>> CREATE:", "").trim();
                    const newContent = response.replace(pathLine, "").trim();
                    app.files.add(newPath, newContent);
                    app.files.select(newPath);
                } else if (currentFile) {
                    app.files.update(currentFile, response);
                    app.files.select(currentFile);
                }

                statusEl.innerText = "Done!";
                setTimeout(() => statusEl.classList.add("hidden"), 2000);
                promptInput.value = "";

            } catch (err) {
                alert("AI Error: " + err.message);
                statusEl.classList.add("hidden");
            }
        }
    },

    manifest: {
        generate() {
            const name = document.getElementById("m-name").value;
            const desc = document.getElementById("m-desc").value;
            const author = document.getElementById("m-author").value;
            
            const manifest = { ...DEFAULT_MANIFEST };
            manifest.header.name = name;
            manifest.header.description = desc;
            manifest.metadata = { authors: [author] };

            app.state.config = manifest;
            app.files.add("manifest.json", JSON.stringify(manifest, null, 2));
            app.router.go("workspace");
        },
        addDependency() {
            // Simplified logic for UI dependency adding
            alert("Dependency UI to be implemented in full version.");
        }
    },

    hub: {
        async init() {
            const grid = document.getElementById("hub-grid");
            if (!grid) return;
            
            try {
                // Fetching from your Gist as per original code
                const response = await fetch("https://gist.githubusercontent.com/JesmerAFK/e65618fc87347bff82f863c284a4ee62/raw/");
                const data = await response.json();
                
                grid.innerHTML = data.map(item => `
                    <div class="bg-surface1 border border-white/10 rounded-xl overflow-hidden hover:border-primary transition-all group">
                        <img src="${item.thumbnail}" class="w-full h-40 object-cover" onerror="this.src='https://placehold.co/400x200?text=No+Image'">
                        <div class="p-4">
                            <h3 class="font-bold text-white truncate">${item.title}</h3>
                            <p class="text-xs text-gray-400 mb-2">by ${item.author}</p>
                            <button onclick="window.open('${item.download_url}', '_blank')" class="w-full bg-primary/20 text-primary hover:bg-primary hover:text-white py-2 rounded transition-colors text-sm font-bold">
                                Download
                            </button>
                        </div>
                    </div>
                `).join("");
            } catch (err) {
                grid.innerHTML = `<p class="text-red-400">Failed to load Hub: ${err.message}</p>`;
            }
        }
    },

    export: {
        async download(type) {
            const zip = new JSZip();
            app.state.files.forEach(f => zip.file(f.path, f.content));
            const blob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${app.state.config.header.name.replace(/\s+/g, "_")}.${type}`;
            link.click();
        }
    },

    import: {
        handle(e) {
            const file = e.target.files[0];
            if (file) this.process(file);
        },
        async process(file) {
            try {
                const zip = await JSZip.loadAsync(file);
                app.state.files = [];
                const promises = [];
                
                zip.forEach((path, entry) => {
                    if (!entry.dir) {
                        promises.push(entry.async("string").then(content => {
                            app.files.add(path, content);
                            if (path === "manifest.json") app.state.config = JSON.parse(content);
                        }));
                    }
                });
                
                await Promise.all(promises);
                app.router.go("workspace");
                if (app.state.files.length > 0) app.files.select(app.state.files[0].path);
            } catch (err) {
                alert("Import failed: " + err.message);
            }
        }
    }
};

// Make app global so onclick events in HTML work
window.app = app;

// Start the app
app.init();
