// fixImports.js
import fs from "fs";
import path from "path";

function walk(dir, ext = ".js") {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full, ext);
    } else if (full.endsWith(ext) || full.endsWith(".jsx") || full.endsWith(".ts") || full.endsWith(".tsx")) {
      let content = fs.readFileSync(full, "utf8");
      if (content.includes("from '@/lib/i18n/client'")) {
        if (!content.includes("useActiveLocale")) {
          content = content.replace(
            /{([^}]*)useT([^}]*)}/,
            (match, before, after) => `{${before}useT, useActiveLocale${after}}`
          );
          fs.writeFileSync(full, content, "utf8");
          console.log("✅ Fixed:", full);
        }
      }
    }
  }
}

walk("./src");
