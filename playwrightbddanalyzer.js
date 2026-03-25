#!/usr/bin/env node
/**
 * Playwright BDD TypeScript – Analyzer v3
 *
 * Scan whole project:  node playwright-bdd-analyzer.js C:\path\to\project
 * Scan single file:    node playwright-bdd-analyzer.js C:\path\to\project --file src\steps\loginSteps.ts
 * List scanned files:  node playwright-bdd-analyzer.js C:\path\to\project --list
 */

var fs   = require("fs");
var path = require("path");

// ─── ARGS ─────────────────────────────────────────────────────────────────────
var args       = process.argv.slice(2);
var TARGET_DIR = path.resolve(args[0] || process.cwd());
var SINGLE     = null;   // path to a single file (optional)
var LIST_ONLY  = false;  // just print discovered files

for (var ai = 1; ai < args.length; ai++) {
  if (args[ai] === "--file" && args[ai + 1]) {
    SINGLE = path.resolve(args[ai + 1]);
    ai++;
  } else if (args[ai] === "--list") {
    LIST_ONLY = true;
  }
}

var REPORT_OUT = path.join(TARGET_DIR, "playwright-bdd-report.html");

var SCAN_EXTS   = [".ts", ".feature", ".json", ".env", ".yml", ".yaml"];
var IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".nyc_output",
  "coverage", "reports", ".vscode", ".idea",
  "allure-results", "allure-report", "test-results", "playwright-report"
]);

// ─── PATH HELPERS ─────────────────────────────────────────────────────────────
function norm(f) { return String(f).replace(/\\/g, "/"); }

function inDir(file) {
  var n = norm(file).toLowerCase();
  for (var i = 1; i < arguments.length; i++) {
    if (n.indexOf("/" + arguments[i].toLowerCase() + "/") !== -1) return true;
  }
  return false;
}

function isTS(f)      { return f.endsWith(".ts") || f.endsWith(".tsx"); }
function isJS(f)      { return f.endsWith(".js") || f.endsWith(".jsx") && f !== ""; }
function isCode(f)    { return isTS(f) || isJS(f); }
function isFeature(f) { return f.endsWith(".feature"); }

function isEnvFile(f) {
  var b = path.basename(f);
  return b === ".env" || /^\.env\.(local|dev|staging|prod|test)$/.test(b);
}

function isConfig(f) {
  var b = path.basename(norm(f)).toLowerCase();
  return ["playwright.config.ts","playwright.config.js",
          "cucumber.config.ts","cucumber.config.js",
          "cucumber.js","cucumber.cjs"].indexOf(b) !== -1;
}

function isPageObj(f) {
  return inDir(f, "pages","page-objects","pageObjects","pageobjects","pom");
}

function isStepFile(f) {
  return inDir(f, "steps","step-definitions","stepDefinitions","step_definitions","stepdefinitions");
}

function isTsConfig(f) { return path.basename(f) === "tsconfig.json"; }

// ─── MATCH HELPER ─────────────────────────────────────────────────────────────
function matchLines(src, regex, message) {
  var findings = [];
  var lines = src.split("\n");
  for (var i = 0; i < lines.length; i++) {
    regex.lastIndex = 0;
    if (regex.test(lines[i])) {
      findings.push({ line: i + 1, snippet: lines[i].trim().slice(0, 130), message: message });
    }
    regex.lastIndex = 0;
  }
  return findings;
}

// ─── RULES ────────────────────────────────────────────────────────────────────
var RULES = [

  // SECURITY
  {
    id:"SEC-001", category:"Security", severity:"critical",
    title:"Hardcoded Password",
    desc:"Passwords must never be committed in source code. Use environment variables.",
    check: function(file, src) {
      if (!isCode(file) && !isEnvFile(file) && !isFeature(file)) return [];
      var f = matchLines(src, /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`\s]{3,}['"`]/gi, "Hardcoded password — move to .env / process.env");
      return f.filter(function(x){ return !/process\.env/.test(x.snippet) && !/\$\{/.test(x.snippet); });
    }
  },
  {
    id:"SEC-002", category:"Security", severity:"critical",
    title:"Hardcoded API Key / Token",
    desc:"API keys and tokens must be stored in environment variables, not source code.",
    check: function(file, src) {
      if (!isCode(file) && !isEnvFile(file)) return [];
      var f = matchLines(src, /(?:api[_-]?key|apikey|auth[_-]?token|access[_-]?token|secret[_-]?key)\s*[:=]\s*['"`][A-Za-z0-9\/+._\-]{8,}['"`]/gi, "Hardcoded API key or token — use process.env");
      return f.filter(function(x){ return !/process\.env/.test(x.snippet); });
    }
  },
  {
    id:"SEC-003", category:"Security", severity:"critical",
    title:"Hardcoded Bearer Token",
    desc:"Bearer tokens in source are a critical credential leak.",
    check: function(file, src) {
      if (!isCode(file)) return [];
      return matchLines(src, /['"`]Bearer\s+[A-Za-z0-9\-._~+\/]{20,}/g, "Hardcoded Bearer token in string literal");
    }
  },
  {
    id:"SEC-004", category:"Security", severity:"high",
    title:"Private Key Material",
    desc:"Private keys must never appear in source code.",
    check: function(file, src) {
      return matchLines(src, /-----BEGIN\s(?:RSA\s|EC\s|DSA\s|OPENSSH\s)?PRIVATE KEY-----/g, "Private key block found in source file");
    }
  },
  {
    id:"SEC-005", category:"Security", severity:"high",
    title:"Connection String with Credentials",
    desc:"Database/service URLs with embedded user:password are insecure.",
    check: function(file, src) {
      if (!isCode(file) && !isEnvFile(file)) return [];
      var f = matchLines(src, /(?:mongodb|postgres|postgresql|mysql|redis|amqp|mssql):\/\/[^:'"` \s]+:[^@'"` \s]{3,}@/gi, "Connection string with embedded credentials");
      return f.filter(function(x){ return !/process\.env/.test(x.snippet) && !/\$\{/.test(x.snippet); });
    }
  },
  {
    id:"SEC-006", category:"Security", severity:"high",
    title:"AWS / GCP Key Pattern",
    desc:"Cloud provider credentials must never be committed.",
    check: function(file, src) {
      var f = [];
      f = f.concat(matchLines(src, /AKIA[0-9A-Z]{16}/g, "AWS Access Key ID pattern detected"));
      f = f.concat(matchLines(src, /AIza[0-9A-Za-z\-_]{35}/g, "GCP API Key pattern detected"));
      return f;
    }
  },
  {
    id:"SEC-007", category:"Security", severity:"medium",
    title:".env File with Real Values Committed",
    desc:".env files with secrets should be in .gitignore. Use .env.example for templates.",
    check: function(file, src) {
      var b = path.basename(norm(file));
      if (b !== ".env" && !b.match(/^\.env\.(local|dev|staging|prod|test)$/)) return [];
      var findings = [];
      var lines = src.split("\n");
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line || line.startsWith("#")) continue;
        if (/^[A-Za-z_][A-Za-z0-9_]*=.{2,}$/.test(line)) {
          findings.push({ line: i+1, snippet: line.replace(/=.+/, "=***REDACTED***"), message: ".env value committed — ensure this file is in .gitignore" });
        }
      }
      return findings;
    }
  },

  // PLAYWRIGHT
  {
    id:"PW-001", category:"Playwright", severity:"high",
    title:"waitForTimeout (Hard Sleep)",
    desc:"Fixed delays make tests slow and flaky. Use expect(locator).toBeVisible() instead.",
    check: function(file, src) {
      if (!isCode(file)) return [];
      return matchLines(src, /\bwaitForTimeout\s*\(\s*\d+/g, "Hard-coded wait — replace with expect(locator).toBeVisible() or toBeEnabled()");
    }
  },
  {
    id:"PW-002", category:"Playwright", severity:"high",
    title:"Hardcoded Base URL",
    desc:"URLs should come from process.env or baseURL in config.",
    check: function(file, src) {
      if (!isCode(file)) return [];
      var f = matchLines(src, /\.goto\s*\(\s*['"`]https?:\/\//g, "Hardcoded URL in goto() — use baseURL from config or process.env.BASE_URL");
      return f.filter(function(x){ return !/process\.env/.test(x.snippet) && !/baseURL/.test(x.snippet); });
    }
  },
  {
    id:"PW-003", category:"Playwright", severity:"medium",
    title:"Fragile ID / Class Selector",
    desc:"CSS ID and class selectors break easily. Prefer data-testid or ARIA roles.",
    check: function(file, src) {
      if (!isCode(file)) return [];
      return matchLines(src, /\.locator\s*\(\s*['"`]\s*(?:#[\w-]+|\.[\w-]+)\s*['"`]/g, "CSS id/class selector — use getByTestId(), getByRole(), or getByLabel()");
    }
  },
  {
    id:"PW-004", category:"Playwright", severity:"medium",
    title:"XPath Locator",
    desc:"XPath is brittle. Prefer getByRole(), getByText(), or getByTestId().",
    check: function(file, src) {
      if (!isCode(file)) return [];
      return matchLines(src, /\.locator\s*\(\s*['"`]\s*\/\//g, "XPath locator — prefer Playwright semantic locators");
    }
  },
  {
    id:"PW-005", category:"Playwright", severity:"high",
    title:"Assertion Inside Page Object",
    desc:"Page Objects should only contain actions. Move expect() calls to step definitions.",
    check: function(file, src) {
      if (!isPageObj(file) || !isCode(file)) return [];
      return matchLines(src, /\bexpect\s*\(/g, "expect() in Page Object — assertions belong in step definitions");
    }
  },
  {
    id:"PW-006", category:"Playwright", severity:"medium",
    title:"Module-Level Mutable State in Step File",
    desc:"let/var at module level in step files causes state leaks between scenarios.",
    check: function(file, src) {
      if (!isStepFile(file) || !isCode(file)) return [];
      var findings = [];
      var lines = src.split("\n");
      for (var i = 0; i < lines.length; i++) {
        if (/^(?:let|var)\s+\w+/.test(lines[i])) {
          findings.push({ line: i+1, snippet: lines[i].trim().slice(0,130), message: "Top-level mutable variable in step file — use Cucumber World instead" });
        }
      }
      return findings;
    }
  },
  {
    id:"PW-007", category:"Playwright", severity:"low",
    title:"console.log in Test Code",
    desc:"Debug console.log should not be committed. Use this.attach() or a logger.",
    check: function(file, src) {
      if (!isCode(file)) return [];
      return matchLines(src, /\bconsole\.log\s*\(/g, "console.log found — use this.attach() or a structured logger");
    }
  },
  {
    id:"PW-008", category:"Playwright", severity:"high",
    title:"Missing retry in Config",
    desc:"Set retry in config to handle environment flakiness in CI.",
    check: function(file, src) {
      if (!isConfig(file)) return [];
      if (/retry|retries/i.test(src)) return [];
      return [{ line:1, snippet: path.basename(file), message: "No retry setting — add retry: 2 for CI stability" }];
    }
  },
  {
    id:"PW-009", category:"Playwright", severity:"medium",
    title:"Missing fullyParallel in playwright.config",
    desc:"fullyParallel: true maximises CI speed.",
    check: function(file, src) {
      var b = path.basename(norm(file)).toLowerCase();
      if (b !== "playwright.config.ts" && b !== "playwright.config.js") return [];
      if (/fullyParallel/.test(src)) return [];
      return [{ line:1, snippet: path.basename(file), message: "fullyParallel not set — consider enabling for faster CI runs" }];
    }
  },
  {
    id:"PW-010", category:"Playwright", severity:"medium",
    title:"No trace / screenshot on Failure",
    desc:"Configure trace and screenshot capture so failures are debuggable.",
    check: function(file, src) {
      var b = path.basename(norm(file)).toLowerCase();
      if (b !== "playwright.config.ts" && b !== "playwright.config.js") return [];
      if (/trace\s*:/.test(src) || /screenshot\s*:/.test(src)) return [];
      return [{ line:1, snippet: path.basename(file), message: "No trace or screenshot config — add to the 'use' block" }];
    }
  },

  // BDD / GHERKIN
  {
    id:"BDD-001", category:"BDD/Gherkin", severity:"medium",
    title:"UI-speak in Feature File",
    desc:"Feature files should describe behaviour, not UI mechanics.",
    check: function(file, src) {
      if (!isFeature(file)) return [];
      var findings = [];
      var lines = src.split("\n");
      for (var i = 0; i < lines.length; i++) {
        if (/^\s*(?:Given|When|Then|And|But)\b/i.test(lines[i])) {
          if (/\b(?:clicks?|types?\s+into|enters?\s+text|selects?\s+from|scrolls?|hovers?)\b/i.test(lines[i])) {
            findings.push({ line:i+1, snippet: lines[i].trim(), message: "UI action language — use business terms e.g. 'the user submits the form'" });
          }
        }
      }
      return findings;
    }
  },
  {
    id:"BDD-002", category:"BDD/Gherkin", severity:"low",
    title:"Untagged Scenario",
    desc:"Every scenario should have at least one tag (@smoke, @regression, @wip).",
    check: function(file, src) {
      if (!isFeature(file)) return [];
      var findings = [];
      var lines = src.split("\n");
      for (var i = 0; i < lines.length; i++) {
        if (/^\s*Scenario(?:\s+Outline)?\s*:/i.test(lines[i])) {
          var prev = "";
          for (var j = i-1; j >= 0; j--) { if (lines[j].trim()) { prev = lines[j]; break; } }
          if (!/@\w+/.test(prev)) {
            findings.push({ line:i+1, snippet: lines[i].trim(), message: "Scenario has no tag — add @smoke, @regression, or @wip" });
          }
        }
      }
      return findings;
    }
  },
  {
    id:"BDD-003", category:"BDD/Gherkin", severity:"medium",
    title:"Hardcoded Test Data in Feature File",
    desc:"Emails, passwords and IDs should be in Scenario Outline + Examples tables.",
    check: function(file, src) {
      if (!isFeature(file)) return [];
      var findings = [];
      var lines = src.split("\n");
      for (var i = 0; i < lines.length; i++) {
        if (!/^\s*(?:Given|When|Then|And|But)\b/i.test(lines[i])) continue;
        if (/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/.test(lines[i]))
          findings.push({ line:i+1, snippet: lines[i].trim(), message: "Hardcoded email — use Scenario Outline + Examples table" });
        if (/(?:password|pwd)\s*["']?\s*[:=]?\s*["'][^"'<]{4,}["']/i.test(lines[i]))
          findings.push({ line:i+1, snippet: lines[i].trim(), message: "Hardcoded password value in Gherkin step" });
      }
      return findings;
    }
  },
  {
    id:"BDD-004", category:"BDD/Gherkin", severity:"low",
    title:"And / But Without Prior Given/When/Then",
    desc:"And/But steps require a preceding Given, When, or Then.",
    check: function(file, src) {
      if (!isFeature(file)) return [];
      var findings = [], hasGWT = false;
      var lines = src.split("\n");
      for (var i = 0; i < lines.length; i++) {
        if (/^\s*(?:Given|When|Then)\b/i.test(lines[i]))               { hasGWT = true; continue; }
        if (/^\s*(?:Scenario|Feature|Background)\b/i.test(lines[i]))   { hasGWT = false; continue; }
        if (/^\s*(?:And|But)\b/i.test(lines[i]) && !hasGWT)
          findings.push({ line:i+1, snippet: lines[i].trim(), message: "'And'/'But' with no preceding Given/When/Then" });
      }
      return findings;
    }
  },

  // TYPESCRIPT
  {
    id:"TS-001", category:"TypeScript", severity:"medium",
    title:"Explicit 'any' Type",
    desc:"Avoid 'any' — use specific types or 'unknown' with type guards.",
    check: function(file, src) {
      if (!isTS(file)) return [];
      var findings = [];
      var lines = src.split("\n");
      for (var i = 0; i < lines.length; i++) {
        if (/:\s*any\b/.test(lines[i]) && !/\/\/.*:\s*any/.test(lines[i]))
          findings.push({ line:i+1, snippet: lines[i].trim().slice(0,130), message: "Explicit 'any' — define a proper type or interface" });
      }
      return findings;
    }
  },
  {
    id:"TS-002", category:"TypeScript", severity:"low",
    title:"Non-null Assertion (!) Overuse",
    desc:"Frequent ! operators bypass TypeScript safety.",
    check: function(file, src) {
      if (!isTS(file)) return [];
      var f = matchLines(src, /\w+!/g, "Non-null assertion — consider optional chaining (?.)");
      return f.length > 3 ? f : [];
    }
  },
  {
    id:"TS-003", category:"TypeScript", severity:"medium",
    title:"Missing strict: true in tsconfig",
    desc:"strict: true enables the full TypeScript type-safety suite.",
    check: function(file, src) {
      if (!isTsConfig(file)) return [];
      try {
        var p = JSON.parse(src);
        if ((p.compilerOptions || {}).strict === true) return [];
      } catch(e) { return []; }
      return [{ line:1, snippet:"tsconfig.json", message: "'strict: true' not set — add it for full type safety" }];
    }
  },
  {
    id:"TS-004", category:"TypeScript", severity:"low",
    title:"require() Instead of import",
    desc:"Use ES module import/export syntax in TypeScript files.",
    check: function(file, src) {
      if (!isTS(file)) return [];
      return matchLines(src, /\brequire\s*\(\s*['"`]/g, "CommonJS require() — use ES import instead");
    }
  },

  // STRUCTURE
  {
    id:"STRUCT-001", category:"Structure", severity:"low",
    title:"TODO / FIXME in Feature File",
    desc:"Implementation notes in Gherkin should be in your issue tracker.",
    check: function(file, src) {
      if (!isFeature(file)) return [];
      return matchLines(src, /#\s*(?:TODO|FIXME|HACK|XXX|TEMP)\b/gi, "TODO/FIXME in feature file — move to issue tracker");
    }
  },
  {
    id:"STRUCT-002", category:"Structure", severity:"medium",
    title:"TODO / FIXME in Test Code",
    desc:"Unresolved TODOs indicate incomplete tests.",
    check: function(file, src) {
      if (!isCode(file)) return [];
      return matchLines(src, /\/\/\s*(?:TODO|FIXME|HACK|TEMP|XXX)\b/gi, "Unresolved TODO/FIXME — resolve before merging");
    }
  },
  {
    id:"STRUCT-003", category:"Structure", severity:"high",
    title:"Skipped or Exclusive Test",
    desc:"test.skip() and test.only() must not be committed.",
    check: function(file, src) {
      if (!isCode(file)) return [];
      var f = [];
      f = f.concat(matchLines(src, /\btest\.skip\s*\(/g,  "Skipped test — fix or delete"));
      f = f.concat(matchLines(src, /\btest\.only\s*\(/g,  "test.only committed — will skip everything else in CI"));
      f = f.concat(matchLines(src, /\bxit\s*\(/g,         "xit (pending) — fix or delete"));
      f = f.concat(matchLines(src, /\.skip\s*\(/g,        "Skipped block — fix or delete"));
      return f;
    }
  },
];

// ─── FILE WALKER ──────────────────────────────────────────────────────────────
function walkDir(dir, out) {
  if (!out) out = [];
  var entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch(e) { console.warn("  ⚠  Cannot read:", dir, e.message); return out; }

  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (IGNORE_DIRS.has(e.name)) continue;
    var full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkDir(full, out);
    } else if (e.isFile()) {
      var hasExt = SCAN_EXTS.some(function(x){ return e.name.endsWith(x); });
      var isEnv  = e.name === ".env" || /^\.env\.(local|dev|staging|prod|test)$/.test(e.name);
      if (hasExt || isEnv) out.push(full);
    }
  }
  return out;
}

// ─── ANALYSE ─────────────────────────────────────────────────────────────────
function analyzeFiles(files, targetDir) {
  var results = [], totalFindings = 0;
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var src;
    try { src = fs.readFileSync(file, "utf8"); } catch(e) { continue; }
    var relPath = path.relative(targetDir, file);
    for (var r = 0; r < RULES.length; r++) {
      var rule = RULES[r], findings;
      try { findings = rule.check(file, src); } catch(e) { findings = []; }
      if (findings && findings.length > 0) {
        results.push({ file: file, relPath: relPath, rule: rule, findings: findings });
        totalFindings += findings.length;
      }
    }
  }
  var sev = function(s){ return results.filter(function(r){ return r.rule.severity===s; }).length; };
  return {
    results: results, totalFindings: totalFindings,
    scannedFiles: files.length,
    critical: sev("critical"), high: sev("high"), medium: sev("medium"), low: sev("low")
  };
}

// ─── ESCAPE HTML ─────────────────────────────────────────────────────────────
function esc(s) {
  return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ─── HTML REPORT ─────────────────────────────────────────────────────────────
function buildReport(data, targetDir, allFiles, singleFile) {
  var results = data.results, summary = data;
  var now = new Date().toLocaleString();
  var score = Math.max(0, 100 - summary.critical*20 - summary.high*8 - summary.medium*3 - summary.low);
  var sc = score>=80?"#10b981":score>=50?"#f59e0b":"#ef4444";
  var sl = score>=80?"✅ Good shape!":score>=50?"⚠️ Needs attention":"🚨 Critical issues!";

  var sm = { critical:{c:"#ef4444",bg:"#1a0a0a",i:"💀"}, high:{c:"#f97316",bg:"#1a0f08",i:"🔴"}, medium:{c:"#f59e0b",bg:"#1a1608",i:"🟡"}, low:{c:"#6366f1",bg:"#0e0f1a",i:"🔵"} };
  var cc = { "Security":"#ef4444","Playwright":"#0d9488","BDD/Gherkin":"#8b5cf6","TypeScript":"#3b82f6","Structure":"#f59e0b" };

  // group by category
  var byC = {};
  results.forEach(function(r){ if(!byC[r.rule.category]) byC[r.rule.category]=[]; byC[r.rule.category].push(r); });

  // sort
  var so = {critical:0,high:1,medium:2,low:3};
  var sorted = results.slice().sort(function(a,b){ return so[a.rule.severity]-so[b.rule.severity]; });

  // category bars
  var bars = Object.keys(byC).map(function(cat){
    var t = byC[cat].reduce(function(n,r){ return n+r.findings.length; },0);
    var col = cc[cat]||"#64748b";
    return '<div class="cb"><span class="cl" style="color:'+col+'">'+cat+'</span>'
      +'<div class="bt"><div class="bf" style="width:'+Math.min(100,t*6)+'%;background:'+col+'"></div></div>'
      +'<span class="cn">'+t+'</span></div>';
  }).join("");

  // cards
  var cards = sorted.map(function(r){
    var m = sm[r.rule.severity]||sm.low;
    var col = cc[r.rule.category]||"#64748b";
    var rows = r.findings.map(function(f){
      return '<div class="fr"><span class="lb">Line '+f.line+'</span>'
        +'<div><code class="sn">'+esc(f.snippet)+'</code>'
        +'<span class="fm">'+esc(f.message)+'</span></div></div>';
    }).join("");
    return '<div class="card" data-sev="'+r.rule.severity+'" data-cat="'+esc(r.rule.category)+'">'
      +'<div class="ch" style="border-left:4px solid '+m.c+';background:'+m.bg+'">'
      +'<div class="ctr"><span class="sp" style="background:'+m.c+'">'+m.i+' '+r.rule.severity.toUpperCase()+'</span>'
      +'<span class="ri" style="color:'+col+'">'+r.rule.id+'</span>'
      +'<strong class="rt">'+esc(r.rule.title)+'</strong></div>'
      +'<div class="cf">📄 '+esc(r.relPath)+'</div>'
      +'<div class="cd">'+esc(r.rule.desc)+'</div></div>'
      +'<div class="cfi">'+rows+'</div></div>';
  }).join("");

  // filter buttons
  var fCat = ["All"].concat(Object.keys(cc)).map(function(c){
    return '<button class="fb'+(c==="All"?" active":"")+'" onclick="fcat(\''+c+'\')">'+c+'</button>';
  }).join("");
  var fSev = ["All","critical","high","medium","low"].map(function(s){
    return '<button class="sb'+(s==="All"?" active":"")+'" onclick="fsev(\''+s+'\')">'+s+'</button>';
  }).join("");

  // file list
  var extC = {ts:"#3b82f6",js:"#f59e0b",feature:"#8b5cf6",json:"#10b981",env:"#ef4444",yml:"#0d9488",yaml:"#0d9488"};
  var flist = allFiles.map(function(f){
    var rel = path.relative(targetDir, f);
    var ext = path.extname(f).replace(".","") || "env";
    return '<div class="fi"><span class="fe" style="background:'+(extC[ext]||"#64748b")+'">'+ext+'</span><span class="fn">'+esc(rel)+'</span></div>';
  }).join("");

  var modeLabel = singleFile
    ? "Single file: " + esc(path.relative(targetDir, singleFile))
    : "Full project scan";

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Playwright BDD Analyzer</title>'
+'<style>'
+'@import url(\'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap\');'
+'*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}'
+':root{--bg:#0a0f1e;--sur:#111827;--sur2:#1e2535;--bdr:#1f2d45;--txt:#e2e8f0;--mut:#64748b;--teal:#0d9488;--tlt:#14b8a6;--mono:\'JetBrains Mono\',monospace;--sans:\'Syne\',sans-serif;}'
+'body{font-family:var(--sans);background:var(--bg);color:var(--txt);line-height:1.6;}'
+'header{background:linear-gradient(135deg,#0a0f1e,#0d2137 50%,#0a1628);border-bottom:1px solid var(--bdr);padding:2rem;position:relative;overflow:hidden;}'
+'header::before{content:\'\';position:absolute;top:-60px;right:-60px;width:300px;height:300px;background:radial-gradient(circle,rgba(13,148,136,.15),transparent 70%);pointer-events:none;}'
+'.hg{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;}'
+'.hi{font-size:2.5rem;filter:drop-shadow(0 0 16px rgba(13,148,136,.5));}'
+'.ht h1{font-size:1.6rem;font-weight:800;letter-spacing:-.02em;}'
+'.ht h1 span{color:var(--tlt);}.ht p{color:var(--mut);font-size:.85rem;margin-top:.2rem;}'
+'.hm{margin-left:auto;text-align:right;font-size:.75rem;}.hm .hp{font-family:var(--mono);color:var(--tlt);}.hm .hd{color:var(--mut);margin-top:.2rem;}'
+'.hmode{display:inline-block;margin-top:.4rem;background:rgba(13,148,136,.2);color:var(--tlt);font-size:.7rem;font-weight:700;padding:.2rem .6rem;border-radius:20px;border:1px solid var(--teal);}'
+'.w{max-width:1200px;margin:0 auto;padding:0 2rem;}'
+'.scard{background:var(--sur);border:1px solid var(--bdr);border-radius:16px;padding:2rem;display:grid;grid-template-columns:auto 1fr auto;gap:2rem;align-items:center;margin:2rem auto;}'
+'.ring{width:100px;height:100px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;border:6px solid;}'
+'.rn{font-size:2rem;font-weight:800;font-family:var(--mono);}.rl{font-size:.6rem;color:var(--mut);letter-spacing:.1em;text-transform:uppercase;}'
+'.sts{display:flex;gap:1.25rem;flex-wrap:wrap;}.st{text-align:center;}'
+'.sn{font-size:1.8rem;font-weight:800;font-family:var(--mono);}.sl2{font-size:.7rem;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;}'
+'.c{color:#ef4444;}.h{color:#f97316;}.m{color:#f59e0b;}.l{color:#6366f1;}.ff{color:var(--tlt);}'
+'.smsg{font-size:.85rem;color:var(--mut);}.smsg strong{color:var(--txt);}'
+'.stit{font-size:.85rem;text-transform:uppercase;letter-spacing:.1em;color:var(--mut);margin-bottom:1rem;font-weight:700;}'
+'.cb{display:flex;align-items:center;gap:1rem;margin-bottom:.7rem;}'
+'.cl{width:120px;font-size:.82rem;font-weight:600;flex-shrink:0;}'
+'.bt{flex:1;height:7px;background:var(--sur2);border-radius:4px;overflow:hidden;}'
+'.bf{height:100%;border-radius:4px;width:0;transition:width .8s ease;}'
+'.cn{width:28px;text-align:right;font-family:var(--mono);font-size:.82rem;color:var(--mut);}'
+'.cov-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;}'
+'.cov-card{background:var(--sur);border:1px solid var(--bdr);border-top:3px solid var(--cc);border-radius:10px;padding:1rem 1.2rem;}'
+'.cov-head{display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem;}'
+'.cov-e{font-size:1.4rem;line-height:1;}.cov-cat{font-size:.9rem;font-weight:800;color:var(--cc);}'
+'.cov-cnt{font-size:.68rem;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin-top:.1rem;}'
+'.cov-desc{font-size:.82rem;color:var(--txt);line-height:1.6;margin-bottom:.75rem;}'
+'.cov-desc code{font-family:var(--mono);font-size:.76rem;background:rgba(255,255,255,.08);color:var(--tlt);padding:.1rem .3rem;border-radius:3px;}'
+'.tags{display:flex;flex-wrap:wrap;gap:.35rem;}'
+'.tag{font-size:.68rem;font-weight:600;background:rgba(255,255,255,.05);color:var(--cc);border:1px solid var(--cc);padding:.12rem .45rem;border-radius:20px;opacity:.85;}'
+'.fils{display:flex;gap:1rem;flex-wrap:wrap;align-items:center;margin-bottom:1.5rem;}'
+'.fg{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;}'
+'.fl{font-size:.72rem;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;}'
+'.fb,.sb{padding:.25rem .65rem;border-radius:20px;border:1px solid var(--bdr);background:var(--sur2);color:var(--mut);font-size:.78rem;font-family:var(--sans);cursor:pointer;transition:all .2s;}'
+'.fb:hover,.sb:hover{border-color:var(--teal);color:var(--tlt);}'
+'.fb.active,.sb.active{background:var(--teal);border-color:var(--teal);color:#fff;font-weight:600;}'
+'.cnt{font-size:.8rem;color:var(--mut);margin-bottom:1rem;}'
+'.card{background:var(--sur);border:1px solid var(--bdr);border-radius:12px;margin-bottom:.85rem;overflow:hidden;transition:transform .15s,box-shadow .15s;}'
+'.card:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,0,0,.3);}'
+'.card.hidden{display:none;}'
+'.ch{padding:.9rem 1.2rem .65rem;}'
+'.ctr{display:flex;align-items:center;gap:.65rem;flex-wrap:wrap;margin-bottom:.35rem;}'
+'.sp{font-size:.68rem;font-weight:700;padding:.18rem .55rem;border-radius:20px;color:#fff;text-transform:uppercase;letter-spacing:.05em;flex-shrink:0;}'
+'.ri{font-family:var(--mono);font-size:.75rem;font-weight:700;}'
+'.rt{font-size:.95rem;font-weight:700;}'
+'.cf{font-family:var(--mono);font-size:.72rem;color:var(--mut);margin-bottom:.35rem;}'
+'.cd{font-size:.8rem;color:var(--mut);}'
+'.cfi{border-top:1px solid var(--bdr);}'
+'.fr{display:grid;grid-template-columns:72px 1fr;gap:.65rem;padding:.55rem 1.2rem;border-bottom:1px solid var(--bdr);font-size:.8rem;}'
+'.fr:last-child{border-bottom:none;}'
+'.lb{font-family:var(--mono);font-size:.7rem;color:var(--tlt);background:rgba(13,148,136,.12);padding:.12rem .35rem;border-radius:3px;white-space:nowrap;align-self:start;margin-top:.1rem;}'
+'.sn{font-family:var(--mono);font-size:.73rem;color:#93c5fd;background:rgba(15,23,42,.7);padding:.2rem .45rem;border-radius:3px;word-break:break-all;display:block;margin-bottom:.25rem;}'
+'.fm{font-size:.76rem;color:var(--mut);}'
+'.ac{text-align:center;padding:4rem 2rem;background:var(--sur);border-radius:16px;border:1px solid #10b981;}'
+'.ac .ai{font-size:3.5rem;margin-bottom:1rem;}'
+'.ac h2{font-size:1.4rem;color:#10b981;margin-bottom:.5rem;}'
+'.ac p{color:var(--mut);}'
+'.fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.35rem;max-height:260px;overflow-y:auto;background:var(--sur);border:1px solid var(--bdr);border-radius:8px;padding:.65rem;}'
+'.fi{display:flex;align-items:center;gap:.4rem;font-family:var(--mono);font-size:.7rem;color:var(--mut);}'
+'.fe{font-size:.6rem;font-weight:700;color:#fff;padding:.08rem .3rem;border-radius:3px;flex-shrink:0;text-transform:uppercase;}'
+'.fn{word-break:break-all;}'
+'.thdr{display:flex;align-items:center;justify-content:space-between;cursor:pointer;padding:.6rem 0;user-select:none;}'
+'.thdr:hover .stit{color:var(--tlt);}'
+'.chev{color:var(--mut);font-size:.85rem;transition:transform .3s;}'
+'.chev.open{transform:rotate(180deg);}'
+'.tbody{display:none;}'
+'.tbody.open{display:block;}'
+'@media(max-width:640px){.scard{grid-template-columns:1fr;}.fr{grid-template-columns:1fr;}.hm{margin-left:0;text-align:left;}.cov-grid{grid-template-columns:1fr;}}'
+'</style></head><body>'
+'<header><div class="hg">'
+'<div class="hi">🎭</div>'
+'<div class="ht"><h1>Playwright BDD <span>Analyzer</span></h1><p>Static analysis · best practices · security · code quality</p></div>'
+'<div class="hm"><div class="hp">📁 '+esc(targetDir)+'</div><div class="hd">🕐 '+now+'</div>'
+'<div class="hmode">'+modeLabel+'</div></div>'
+'</div></header>'
+'<div class="w">'

// SCORE
+'<div class="scard">'
+'<div class="ring" style="border-color:'+sc+';color:'+sc+'"><div class="rn">'+score+'</div><div class="rl">/ 100</div></div>'
+'<div class="sts">'
+'<div class="st"><div class="sn c">'+summary.critical+'</div><div class="sl2">Critical</div></div>'
+'<div class="st"><div class="sn h">'+summary.high+'</div><div class="sl2">High</div></div>'
+'<div class="st"><div class="sn m">'+summary.medium+'</div><div class="sl2">Medium</div></div>'
+'<div class="st"><div class="sn l">'+summary.low+'</div><div class="sl2">Low</div></div>'
+'<div class="st"><div class="sn ff">'+summary.scannedFiles+'</div><div class="sl2">Files</div></div>'
+'</div>'
+'<div class="smsg"><strong>'+summary.totalFindings+' findings</strong> across<br>'+summary.scannedFiles+' files.<br>'
+'<span style="color:'+sc+';font-weight:700;font-size:1.05rem">'+sl+'</span></div>'
+'</div>'

// WHAT THIS CHECKS
+'<div style="margin-bottom:2.5rem">'
+'<div class="cov-head" style="margin-bottom:1.2rem"><span class="cov-e">📋</span><div><div style="font-size:1.05rem;font-weight:800">What this analyzer checks</div><div style="font-size:.8rem;color:var(--tlt);font-weight:600;margin-top:.1rem">28 rules across 5 categories</div></div></div>'
+'<div class="cov-grid">'
+'<div class="cov-card" style="--cc:#ef4444"><div class="cov-head"><span class="cov-e">🔒</span><div><div class="cov-cat">Security</div><div class="cov-cnt">7 rules</div></div></div><p class="cov-desc">Hardcoded passwords, API keys, Bearer tokens, private keys, connection strings with credentials, AWS/GCP key patterns, and <code>.env</code> files with real values</p><div class="tags"><span class="tag">Passwords</span><span class="tag">API Keys</span><span class="tag">Bearer Tokens</span><span class="tag">Private Keys</span><span class="tag">Connection Strings</span><span class="tag">AWS/GCP Keys</span><span class="tag">.env Files</span></div></div>'
+'<div class="cov-card" style="--cc:#0d9488"><div class="cov-head"><span class="cov-e">🎭</span><div><div class="cov-cat">Playwright</div><div class="cov-cnt">10 rules</div></div></div><p class="cov-desc"><code>waitForTimeout</code> hard sleeps, hardcoded URLs, fragile ID/CSS selectors, XPath locators, assertions inside Page Objects, global state in step files, <code>console.log</code>, missing <code>retries</code>, <code>fullyParallel</code>, and trace/screenshot config</p><div class="tags"><span class="tag">Hard Sleeps</span><span class="tag">Hardcoded URLs</span><span class="tag">CSS Selectors</span><span class="tag">XPath</span><span class="tag">Page Object Assertions</span><span class="tag">Global State</span><span class="tag">console.log</span><span class="tag">retries</span><span class="tag">fullyParallel</span><span class="tag">Trace Config</span></div></div>'
+'<div class="cov-card" style="--cc:#8b5cf6"><div class="cov-head"><span class="cov-e">🥒</span><div><div class="cov-cat">BDD / Gherkin</div><div class="cov-cnt">4 rules</div></div></div><p class="cov-desc">UI-speak in feature files, untagged scenarios, hardcoded test data/emails/passwords, and misused <code>And</code>/<code>But</code></p><div class="tags"><span class="tag">UI Language</span><span class="tag">Untagged Scenarios</span><span class="tag">Hardcoded Data</span><span class="tag">And/But Misuse</span></div></div>'
+'<div class="cov-card" style="--cc:#3b82f6"><div class="cov-head"><span class="cov-e">📘</span><div><div class="cov-cat">TypeScript</div><div class="cov-cnt">4 rules</div></div></div><p class="cov-desc">Explicit <code>any</code>, overused non-null assertions, missing <code>strict: true</code> in tsconfig, and <code>require()</code> instead of <code>import</code></p><div class="tags"><span class="tag">Explicit any</span><span class="tag">Non-null Assertions</span><span class="tag">strict Mode</span><span class="tag">require() Usage</span></div></div>'
+'<div class="cov-card" style="--cc:#f59e0b"><div class="cov-head"><span class="cov-e">📁</span><div><div class="cov-cat">Structure</div><div class="cov-cnt">3 rules</div></div></div><p class="cov-desc">TODOs in feature files, unresolved <code>FIXME</code>/<code>TODO</code> comments, and skipped/pending tests (<code>test.skip</code>, <code>test.only</code>, <code>xit</code>)</p><div class="tags"><span class="tag">TODOs in Features</span><span class="tag">FIXME Comments</span><span class="tag">test.skip</span><span class="tag">test.only</span><span class="tag">xit</span></div></div>'
+'</div></div>'

// FINDINGS BY CATEGORY
+'<div style="margin-bottom:2rem"><div class="stit">Findings by Category</div>'+(bars||'<p style="color:var(--mut)">No findings.</p>')+'</div>'

// FILTERS
+'<div class="fils"><div class="fg"><span class="fl">Category:</span>'+fCat+'</div><div class="fg"><span class="fl">Severity:</span>'+fSev+'</div></div>'

// CARDS
+'<div class="cnt" id="cnt">'+results.length+' issues found</div>'
+(results.length===0
  ? '<div class="ac"><div class="ai">🎉</div><h2>All clear!</h2><p>No issues detected.</p></div>'
  : '<div id="cards">'+cards+'</div>')

// FILES SCANNED
+'<div style="margin:2.5rem 0 3rem">'
+'<div class="thdr" onclick="tog(\'fb\',\'fc\')"><div class="stit" style="margin:0">📂 Files Scanned ('+allFiles.length+')</div><span class="chev" id="fc">▼</span></div>'
+'<div class="tbody" id="fb"><div class="fgrid">'+flist+'</div></div>'
+'</div>'

+'</div>'
+'<script>'
+'var aC="All",aS="All";'
+'function fcat(c){aC=c;document.querySelectorAll(".fb").forEach(function(b){b.classList.toggle("active",b.textContent===c);});app();}'
+'function fsev(s){aS=s;document.querySelectorAll(".sb").forEach(function(b){b.classList.toggle("active",b.textContent===s);});app();}'
+'function app(){var v=0;document.querySelectorAll(".card").forEach(function(c){var ok=(aC==="All"||c.dataset.cat===aC)&&(aS==="All"||c.dataset.sev===aS);c.classList.toggle("hidden",!ok);if(ok)v++;});document.getElementById("cnt").textContent=v+" issues shown";}'
+'function tog(bi,ci){document.getElementById(bi).classList.toggle("open");document.getElementById(ci).classList.toggle("open");}'
+'window.addEventListener("load",function(){document.querySelectorAll(".bf").forEach(function(b){var w=b.style.width;b.style.width="0";setTimeout(function(){b.style.width=w;},150);});});'
+'</script></body></html>';
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
console.log("\n🎭  Playwright BDD Analyzer v3");
console.log("📁  Project : " + TARGET_DIR);

if (!fs.existsSync(TARGET_DIR)) {
  console.error("❌  Path not found: " + TARGET_DIR);
  console.error("    Usage: node playwright-bdd-analyzer.js C:\\path\\to\\project");
  process.exit(1);
}

// Discover files
var allFiles = walkDir(TARGET_DIR);

// --list mode: just print files and exit
if (LIST_ONLY) {
  console.log("\n📋  Files discovered (" + allFiles.length + "):\n");
  allFiles.forEach(function(f){ console.log("  " + path.relative(TARGET_DIR, f)); });
  process.exit(0);
}

// --file mode: scan only that one file
var filesToScan = SINGLE ? [SINGLE] : allFiles;

if (SINGLE) {
  if (!fs.existsSync(SINGLE)) {
    console.error("❌  File not found: " + SINGLE);
    process.exit(1);
  }
  console.log("📄  Single file : " + path.relative(TARGET_DIR, SINGLE));
}

console.log("");

var data = analyzeFiles(filesToScan, TARGET_DIR);

// Console output
var byCat = {};
data.results.forEach(function(r){ if(!byCat[r.rule.category]) byCat[r.rule.category]=[]; byCat[r.rule.category].push(r); });
var icons = {critical:"💀",high:"🔴",medium:"🟡",low:"🔵"};
Object.keys(byCat).forEach(function(cat){
  console.log("── " + cat + " ──");
  byCat[cat].forEach(function(r){
    console.log("  "+(icons[r.rule.severity]||"•")+" ["+r.rule.id+"] "+r.rule.title+" ("+r.findings.length+" finding"+(r.findings.length>1?"s":"")+")");
    r.findings.slice(0,2).forEach(function(f){ console.log("     Line "+f.line+": "+f.snippet.slice(0,80)); });
  });
  console.log("");
});

console.log("──────────────────────────────────────");
console.log("  Files scanned : " + data.scannedFiles);
console.log("  Total findings: " + data.totalFindings);
console.log("  💀 Critical   : " + data.critical);
console.log("  🔴 High       : " + data.high);
console.log("  🟡 Medium     : " + data.medium);
console.log("  🔵 Low        : " + data.low);
console.log("──────────────────────────────────────");

var html = buildReport(data, TARGET_DIR, allFiles, SINGLE);
fs.writeFileSync(REPORT_OUT, html, "utf8");
console.log("\n✅  Report saved → " + REPORT_OUT + "\n");
