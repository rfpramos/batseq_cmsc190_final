import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { phylotree } from "phylotree";
import "phylotree/dist/phylotree.css";

export default function PhyloTree() {
  const treeContainerRef = useRef(null);

  useEffect(() => {
    async function loadTree() {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/assets/sibal.nwk`);
        const newick = await response.text();
        console.log("Fetched Newick:", newick);

        const containerEl = treeContainerRef.current;
        if (!containerEl) {
          console.error("PhyloTree: container ref is not available");
          return;
        }

        // Snapshot existing SVGs so we can detect any new ones created by phylotree
        const prevSVGs = Array.from(document.querySelectorAll("svg"));

        // Clear container and ensure it constrains its children
        containerEl.innerHTML = "";
        containerEl.style.overflow = "auto";
        containerEl.style.position = containerEl.style.position || "relative";

  // Compute SVG size from the container so the tree fills available space (responsive)
  const rect = containerEl.getBoundingClientRect();
  // If the element hasn't been measured yet, fall back to client sizes or window
  const measuredWidth = Math.round(rect.width) || containerEl.clientWidth || Math.round(window.innerWidth * 0.8);
  const measuredHeight = Math.round(rect.height) || containerEl.clientHeight || Math.round(window.innerHeight * 0.6);
  const svgWidth = Math.max(600, measuredWidth);
  const svgHeight = Math.max(400, measuredHeight);

        // Construct phylotree instance using the class constructor
        let tree;
        try {
          tree = new phylotree(newick);
          console.log("phylotree: constructed with newick string");
        } catch (e) {
          // Some versions may export default instead; try that fallback
          try {
            const Ph = phylotree;
            tree = new Ph(newick);
            console.log("phylotree: constructed via fallback Ph class");
          } catch (err) {
            console.error("phylotree: could not construct instance:", err);
            // Show raw Newick as fallback inside the container
            try {
              const errSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
              errSvg.setAttribute("width", svgWidth);
              errSvg.setAttribute("height", 40);
              const t1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
              t1.setAttribute("x", 10);
              t1.setAttribute("y", 20);
              t1.setAttribute("fill", "#b00");
              t1.textContent = "Error constructing phylotree: see console";
              const t2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
              t2.setAttribute("x", 10);
              t2.setAttribute("y", 40);
              t2.textContent = newick.substring(0, 200);
              errSvg.appendChild(t1);
              errSvg.appendChild(t2);
              containerEl.appendChild(errSvg);
            } catch (fallbackErr) {
              console.warn("PhyloTree: failed to render fallback SVG:", fallbackErr);
              // As ultimate fallback, append plain text
              const pre = document.createElement("pre");
              pre.textContent = "Error constructing phylotree\n" + newick.substring(0, 200);
              containerEl.appendChild(pre);
            }
            return;
          }
        }

        // Render using the public API: phylotree.render({container: Element, width, height})
        try {
          const display = tree.render({ container: containerEl, width: svgWidth, height: svgHeight });
          console.log("phylotree: render() returned display:", !!display);

          // If the render returns a display object that exposes show(), prefer that SVG
          try {
            if (display && typeof display.show === "function") {
              const svgNodeFromDisplay = display.show();
                if (svgNodeFromDisplay) {
                // make sure it's inside our container
                if (!containerEl.contains(svgNodeFromDisplay)) {
                  containerEl.innerHTML = ""; // remove stray nodes
                  containerEl.appendChild(svgNodeFromDisplay);
                }
                // Prefer CSS sizing to make it responsive inside the container
                svgNodeFromDisplay.style.display = svgNodeFromDisplay.style.display || "block";
                svgNodeFromDisplay.style.width = "100%";
                svgNodeFromDisplay.style.height = "100%";
                svgNodeFromDisplay.style.maxWidth = "100%";
                // Ensure attributes exist for libraries that inspect them
                if (!svgNodeFromDisplay.getAttribute("width")) svgNodeFromDisplay.setAttribute("width", svgWidth);
                if (!svgNodeFromDisplay.getAttribute("height")) svgNodeFromDisplay.setAttribute("height", svgHeight);
                // Add a viewBox if missing so scaling behaves predictably
                if (!svgNodeFromDisplay.getAttribute("viewBox")) {
                  svgNodeFromDisplay.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
                }
              }
            }
          } catch (appendErr) {
            console.warn("phylotree: could not append display svg node:", appendErr);
          }

          // If the library created SVGs elsewhere (some versions append to body or sibling),
          // detect newly-created SVGs and move them into the container.
          try {
            const afterSVGs = Array.from(document.querySelectorAll("svg"));
            const newSVGs = afterSVGs.filter((s) => !prevSVGs.includes(s) && !containerEl.contains(s));
            newSVGs.forEach((s) => {
              try {
                containerEl.appendChild(s);
                s.style.display = s.style.display || "block";
                s.style.width = s.style.width || "100%";
                s.style.height = s.style.height || "100%";
                s.style.maxWidth = s.style.maxWidth || "100%";
                if (!s.getAttribute("width")) s.setAttribute("width", svgWidth);
                if (!s.getAttribute("height")) s.setAttribute("height", svgHeight);
                if (!s.getAttribute("viewBox")) s.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
              } catch (mvErr) {
                console.warn("phylotree: failed moving svg into container:", mvErr);
              }
            });
          } catch (scanErr) {
            console.warn("phylotree: error scanning for new svgs:", scanErr);
          }

          if (display && typeof display.layout === "function") display.layout();
          if (display && typeof display.update === "function") display.update();
        } catch (renderErr) {
          console.warn("phylotree: render(container) failed, attempting fallback render:", renderErr);
          try {
            // Try rendering directly into the container element instead
            const display = tree.render({ container: containerEl });
            if (display && typeof display.layout === "function") display.layout();
          } catch (e) {
            console.error("phylotree: fallback render also failed:", e);
            // As a last resort, draw a minimal textual fallback inside container
            const errText = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            errText.setAttribute("width", svgWidth);
            errText.setAttribute("height", 40);
            const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            txt.setAttribute("x", 10);
            txt.setAttribute("y", 20);
            txt.setAttribute("fill", "#b00");
            txt.textContent = "phylotree render failed — see console";
            errText.appendChild(txt);
            containerEl.appendChild(errText);
          }
        }
      } catch (error) {
        console.error("Error loading or rendering Newick file:", error);
      }
    }

    loadTree();
  }, []);

return (
    <div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-green-400">
            Phylogenetic Tree
        </h2>
        <div
            ref={treeContainerRef}
            // Use Tailwind dark variants so the container responds to theme (falls back to CSS if not using Tailwind)
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded"
            style={{
                height: "70vh", // responsive height retained
            }}
        ></div>
    </div>
);
}
