/**
 * NETECMT APC Sprint-Audit Runner (Minimal JS version for CI)
 * 
 * Usage: node run.js --changed-files "file1.js file2.md"
 */

const fs = require('fs');
const path = require('path');

// Basic command line parsing
const args = process.argv.slice(2);
const changedFilesArgIndex = args.indexOf('--changed-files');
if (changedFilesArgIndex === -1) {
    console.error("Error: --changed-files argument missing");
    process.exit(1);
}

const changedFiles = args[changedFilesArgIndex + 1].split(/\s+/).map(f => f.trim()).filter(f => f);
const jsonOutputIndex = args.indexOf('--json');
const outputPath = jsonOutputIndex !== -1 ? args[jsonOutputIndex + 1] : null;

const contractMapPath = path.join(__dirname, '../../../core/contract-map.yaml');

// Simple YAML parser for the required structure
function parseContractMap(content) {
    const lanes = {};
    let currentLane = null;

    const lines = content.split('\n');
    let inLanes = false;

    for (const line of lines) {
        if (line.trim().startsWith('lanes:')) {
            inLanes = true;
            continue;
        }
        if (!inLanes) continue;

        // Detect lane name
        const laneMatch = line.match(/^  (\w+):/);
        if (laneMatch) {
            currentLane = laneMatch[1];
            lanes[currentLane] = { paths: [], contract: '' };
            continue;
        }

        if (currentLane) {
            // Detect contract
            const contractMatch = line.match(/^    contract: "(.+?)"/);
            if (contractMatch) {
                lanes[currentLane].contract = contractMatch[1];
                continue;
            }

            // Detect paths (simplified)
            const pathMatch = line.match(/^      - "(.+?)"/);
            if (pathMatch) {
                lanes[currentLane].paths.push(pathMatch[1]);
            }
        }
    }
    return lanes;
}

if (!fs.existsSync(contractMapPath)) {
    console.error(`Error: Contract map not found at ${contractMapPath}`);
    process.exit(1);
}

const contractMapContent = fs.readFileSync(contractMapPath, 'utf8');
const lanes = parseContractMap(contractMapContent);

console.log("🔍 APC Sprint Audit Runner starting...");
console.log(`Analyzing ${changedFiles.length} files...`);

let driftDetected = false;
const findings = [];

// Helper to check if a file matches a glob-like pattern (simplified for CI)
function matchesPattern(file, patterns) {
    return patterns.some(pattern => {
        const cleanPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
        const regex = new RegExp(`^${cleanPattern}$`);
        return regex.test(file);
    });
}

for (const [laneName, config] of Object.entries(lanes)) {
    const laneFiles = changedFiles.filter(f => matchesPattern(f, config.paths));

    if (laneFiles.length > 0) {
        const contractChanged = changedFiles.some(f => f === config.contract);

        if (!contractChanged) {
            const message = `[CONTRACT_DRIFT] Lane '${laneName}' code changed but contract '${config.contract}' was NOT updated.`;
            const finding = {
                type: 'CONTRACT_DRIFT',
                lane: laneName,
                contract: config.contract,
                affectedFiles: laneFiles,
                message: message,
                actionHint: `Update ${config.contract} to reflect behavioral changes in ${laneFiles.join(', ')}`
            };
            findings.push(finding);
            driftDetected = true;
        }
    }
}

if (outputPath) {
    const report = {
        timestamp: new Date().toISOString(),
        status: driftDetected ? 'FAIL' : 'PASS',
        findings: findings
    };
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 JSON Report generated at: ${outputPath}`);
}

// Write to metrics.jsonl
const metricsDir = path.join(__dirname, '../../../reports');
if (!fs.existsSync(metricsDir)) fs.mkdirSync(metricsDir, { recursive: true });
const metricsPath = path.join(metricsDir, 'metrics.jsonl');
const metricsLine = JSON.stringify({
    ts: new Date().toISOString(),
    type: "sprint_audit",
    drift_count: findings.length,
    drift_lanes: findings.map(f => f.lane),
    status: driftDetected ? 'FAIL' : 'PASS',
    changed_files_count: changedFiles.length
}) + '\n';
fs.appendFileSync(metricsPath, metricsLine);
console.log(`📊 Metrics logged to: ${metricsPath}`);

if (driftDetected) {
    console.log("\n❌ FAIL: Contract Drift Detected!");
    findings.forEach(f => console.log(`  - ${f.message}`));
    process.exit(1);
} else {
    console.log("\n✅ PASS: No contract drift detected.");
    process.exit(0);
}
