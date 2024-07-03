/**
 * DevGuard - JavaScript Code Analyzer
 * 
 * This script analyzes JavaScript code for potential issues and anomalies.
 * It traverses the Abstract Syntax Tree (AST) of the provided JavaScript file 
 * and applies custom rules to identify common coding issues such as:
 * - Undeclared variables
 * - Potential null pointer exceptions
 * - Deeply nested callbacks (callback hell)
 * - Console.log statements
 * - Usage of 'var' (prefer 'let' or 'const')
 * - Functions with too many parameters
 * - Long functions
 * - Magic numbers
 * 
 * Author: Duane Robinson
 * Date: 2024-07-03
 */

const esprima = require('esprima');
const estraverse = require('estraverse');
const fs = require('fs');

class DevGuard {
    constructor(filePath) {
        this.filePath = filePath;
        this.sourceCode = fs.readFileSync(filePath, 'utf-8');
        this.ast = esprima.parseScript(this.sourceCode, { loc: true });
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
                const nullCheckPattern = new RegExp(`${objectName}\\s*=\\s*null`);
                if (nullCheckPattern.test(this.sourceCode)) {
                    anomalies.push({
                        message: `Potential null pointer exception on: ${objectName}`,
                        line: node.loc.start.line
                    });
                }
            }

            // Custom rule: Identify deeply nested callbacks
            if (node.type === 'FunctionExpression' && parent && parent.type === 'CallExpression' && parent.callee.type === 'FunctionExpression') {
                anomalies.push({
                    message: `Deeply nested callback detected which can lead to callback hell.`,
                    line: node.loc.start.line
                });
            }

            // Custom rule: Detect console.log statements
            if (node.type === 'CallExpression' && node.callee.object && node.callee.object.name === 'console' && node.callee.property.name === 'log') {
                anomalies.push({
                    message: `Console.log statement detected.`,
                    line: node.loc.start.line
                });
            }

            // Custom rule: Detect usage of 'var' (prefer 'let' or 'const')
            if (node.type === 'VariableDeclaration' && node.kind === 'var') {
                anomalies.push({
                    message: `Usage of 'var' detected. Consider using 'let' or 'const' instead.`,
                    line: node.loc.start.line
                });
            }

            // Custom rule: Detect functions with too many parameters
            if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
                if (node.params.length > 3) {
                    anomalies.push({
                        message: `Function has too many parameters (${node.params.length}). Consider refactoring.`,
                        line: node.loc.start.line
                    });
                }
            }

            // Custom rule: Detect long functions
            if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
                const functionStart = node.loc.start.line;
                const functionEnd = node.loc.end.line;
                const functionLength = functionEnd - functionStart;
                if (functionLength > 50) {
                    anomalies.push({
                        message: `Function is too long (${functionLength} lines). Consider refactoring.`,
                        line: functionStart
                    });
                }
            }

            // Custom rule: Detect magic numbers
            if (node.type === 'Literal' && typeof node.value === 'number') {
                anomalies.push({
                    message: `Magic number detected: ${node.value}. Consider defining a constant.`,
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
