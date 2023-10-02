const esprima = require('esprima');
const estraverse = require('estraverse');
const fs = require('fs');

class DevGuard {
    constructor(filePath) {
        this.filePath = filePath;
        this.sourceCode = fs.readFileSync(filePath, 'utf-8');
        this.ast = esprima.parseScript(this.sourceCode);
    }

    traverseAST(callback) {
        estraverse.traverse(this.ast, {
            enter: callback
        });
    }

    checkForAnomalies() {
        const anomalies = [];

        this.traverseAST((node, parent) => {
            // Custom rule: Check for undeclared variables
            if (node.type === 'VariableDeclaration' && node.declarations[0].init === null) {
                anomalies.push({
                    message: `Undeclared variable detected: ${node.declarations[0].id.name}`,
                    line: node.loc.start.line
                });
            }

            // Custom rule: Detect potential null pointer exceptions
            if (node.type === 'MemberExpression' && parent && parent.type !== 'AssignmentExpression') {
                const objectName = node.object.name;
                if (this.sourceCode.includes(`${objectName} = null`)) {
                    anomalies.push({
                        message: `Potential null pointer exception on: ${objectName}`,
                        line: node.loc.start.line
                    });
                }
            }

            // Custom rule: Identify deeply nested callbacks
            if (node.type === 'FunctionExpression' && parent.type === 'CallExpression' && parent.callee.type === 'FunctionExpression') {
                anomalies.push({
                    message: `Deeply nested callback detected which can lead to callback hell.`,
                    line: node.loc.start.line
                });
            }
        });

        return anomalies;
    }
}

const filePath = './path/to/your/js/file.js';
const devGuard = new DevGuard(filePath);
const anomalies = devGuard.checkForAnomalies();

console.log('Potential anomalies detected:', anomalies);
