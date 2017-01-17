const fs = require('fs');
const nopt = require('nopt');
const path = require('path');
let labelNumber = 0;
let returnNumber = 0;

function getParsedOptions() {
    const options = {
        'file': path,
        'dir': path,
        'no-init': Boolean
    }
    const shortHands = {
        'f': ['--file'],
        'd': ['--dir'],
        'n': ['--noInit']
    }

    return nopt(options, shortHands);
}

function removeWhitespace(lines) {
    return lines.reduce((prev, line) => {
        if (line.length === 0 || line.startsWith('//')) {
            return prev
        }
        cleanLine = line.split('//')[0].trim();
        return [...prev, cleanLine]
    }, [])
}

function newLabel() {
    return `l$${labelNumber++}`
}

function parseLine(line, fileName) {
    const [command, arg1, arg2] = line.split(' ');
    switch (command) {
        case 'add':
            return [
                '@SP // ADD',
                'AM=M-1',
                'D=M',
                'A=A-1',
                'M=D+M'
            ].join('\n');
        case 'sub':
            return [
                '@SP // SUB',
                'AM=M-1',
                'D=M',
                'A=A-1',
                'M=M-D'
            ].join('\n');
        case 'neg':
            return [
                '@SP',
                'A=M-1',
                'M=-M'
            ].join('\n');
        case 'eq': {
            const label = newLabel();
            const label2 = newLabel();
            return [
                '@SP',
                'AM=M-1',
                'D=M',
                'A=A-1',
                'D=D-M',
                `@${label}`,
                'D;JNE',
                '@0',
                'D=!A',
                `@${label2}`,
                '0;JMP',
                `(${label})`,
                '@0',
                'D=A',
                `(${label2})`,
                '@SP',
                'A=M-1',
                'M=D'
            ].join('\n');
        }
        case 'gt': {
            const label = newLabel();
            const label2 = newLabel();
            return [
                '@SP',
                'AM=M-1',
                'D=M',
                'A=A-1',
                'D=D-M',
                `@${label}`,
                'D;JGE',
                '@0',
                'D=!A',
                `@${label2}`,
                '0;JMP',
                `(${label})`,
                '@0',
                'D=A',
                `(${label2})`,
                '@SP',
                'A=M-1',
                'M=D'
            ].join('\n');
        }
        case 'lt': {
            const label = newLabel();
            const label2 = newLabel();
            return [
                '@SP',
                'AM=M-1',
                'D=M',
                'A=A-1',
                'D=D-M',
                `@${label}`,
                'D;JLE',
                '@0',
                'D=!A',
                `@${label2}`,
                '0;JMP',
                `(${label})`,
                '@0',
                'D=A',
                `(${label2})`,
                '@SP',
                'A=M-1',
                'M=D'
            ].join('\n');
        }
        case 'and':
            return [
                '@SP',
                'AM=M-1',
                'D=M',
                'A=A-1',
                'M=D&M'
            ].join('\n');
        case 'or':
            return [
                '@SP',
                'AM=M-1',
                'D=M',
                'A=A-1',
                'M=D|M'
            ].join('\n');
        case 'not':
            return [
                '@SP',
                'A=M-1',
                'M=!M'
            ].join('\n');
        case 'pop':
            switch (arg1) {
                case 'local':
                    return [
                        '@LCL // POP',
                        'D=M',
                        `@${arg2}`,
                        'D=D+A',
                        '@R13',
                        'M=D',
                        '@SP',
                        'AM=M-1',
                        'D=M',
                        '@R13',
                        'A=M',
                        'M=D'
                    ].join('\n');
                case 'argument':
                    return [
                        '@ARG // POP',
                        'D=M',
                        `@${arg2}`,
                        'D=D+A',
                        '@R13',
                        'M=D',
                        '@SP',
                        'AM=M-1',
                        'D=M',
                        '@R13',
                        'A=M',
                        'M=D'
                    ].join('\n');
                case 'this':
                    return [
                        '@THIS // POP',
                        'D=M',
                        `@${arg2}`,
                        'D=D+A',
                        '@R13',
                        'M=D',
                        '@SP',
                        'AM=M-1',
                        'D=M',
                        '@R13',
                        'A=M',
                        'M=D'
                    ].join('\n');
                case 'that':
                    return [
                        '@THAT // POP',
                        'D=M',
                        `@${arg2}`,
                        'D=D+A',
                        '@R13',
                        'M=D',
                        '@SP',
                        'AM=M-1',
                        'D=M',
                        '@R13',
                        'A=M',
                        'M=D'
                    ].join('\n');
                case 'temp':
                    return [
                        '@SP // POP',
                        'AM=M-1',
                        'D=M',
                        `@${+arg2 + 5}`,
                        'M=D'
                    ].join('\n');
                case 'static':
                    return [
                        '@SP // POP',
                        'AM=M-1',
                        'D=M',
                        `@${fileName}.${arg2}`,
                        'M=D'
                    ].join('\n');
                case 'pointer':
                    return [
                        '@SP // POP',
                        'AM=M-1',
                        'D=M',
                        `@${+arg2 + 3}`,
                        'M=D'
                    ].join('\n');

            }
        case 'push':
            switch (arg1) {
                case 'constant': {
                    return [
                        `@${arg2} // PUSH`,
                        'D=A',
                        '@SP',
                        'M=M+1',
                        'A=M-1',
                        'M=D',
                    ].join('\n');
                }
                case 'local':
                    return [
                        '@LCL // PUSH',
                        'D=M',
                        `@${arg2}`,
                        'A=D+A',
                        'D=M',
                        '@SP',
                        'M=M+1',
                        'A=M-1',
                        'M=D',
                    ].join('\n');
                case 'argument':
                    return [
                        '@ARG // PUSH',
                        'D=M',
                        `@${arg2}`,
                        'A=D+A',
                        'D=M',
                        '@SP',
                        'M=M+1',
                        'A=M-1',
                        'M=D',
                    ].join('\n');
                case 'this':
                    return [
                        '@THIS // PUSH',
                        'D=M',
                        `@${arg2}`,
                        'A=D+A',
                        'D=M',
                        '@SP',
                        'M=M+1',
                        'A=M-1',
                        'M=D',
                    ].join('\n');
                case 'that':
                    return [
                        '@THAT // PUSH',
                        'D=M',
                        `@${arg2}`,
                        'A=D+A',
                        'D=M',
                        '@SP',
                        'M=M+1',
                        'A=M-1',
                        'M=D',
                    ].join('\n');
                case 'temp':
                    return [
                        `@${+arg2 + 5} // PUSH`,
                        'D=M',
                        '@SP',
                        'M=M+1',
                        'A=M-1',
                        'M=D',
                    ].join('\n');
                case 'static':
                    return [
                        `@${fileName}.${arg2} // PUSH`,
                        'D=M',
                        '@SP',
                        'M=M+1',
                        'A=M-1',
                        'M=D',
                    ].join('\n');
                case 'pointer':
                    return [
                        `@${+arg2 + 3} // PUSH`,
                        'D=M',
                        '@SP',
                        'M=M+1',
                        'A=M-1',
                        'M=D',
                    ].join('\n');
            }
        case 'label':
            return `(${arg1})`;
        case 'goto':
            return [
                `@${arg1} // goto ${arg1}`,
                '0;JMP',
            ].join('\n');
        case 'if-goto':
            return [
                '@SP // if-goto',
                'AM=M-1',
                'D=M',
                `@${arg1}`,
                'D;JNE'
            ].join('\n');
        case 'call':
            const returnLabel = `RETURN${returnNumber++}`
            return [
                `//${line}`,
                `@${returnLabel}`,
                'D=A',
                '@SP',
                'M=M+1',
                'A=M-1',
                'M=D',
                parseLine('push temp -4'),
                parseLine('push temp -3'),
                parseLine('push temp -2'),
                parseLine('push temp -1'),
                `@${+arg2 + 5}`,
                'D=A',
                '@SP',
                'D=M-D',
                '@ARG',
                'M=D',
                '@SP',
                'D=M',
                '@LCL',
                'M=D',
                `@${arg1}`,
                '0;JMP',
                `(${returnLabel})`
            ].join('\n');
        case 'function':
            const lines = [
                `//${line}`,
                `(${arg1})`,
                '@SP',
                'A=M',
            ];

            for (var i = 0; i < arg2; i++) {
                lines.push('M=0',
                    'A=A+1');
            }

            lines.push(...[
                `@${arg2}`,
                'D=A',
                '@SP',
                'M=D+M'
            ])
            return lines.join('\n');
        case 'return':
            return [
                `@LCL //${line}`,
                'D=M-1',
                '@R13',
                'M=D',
                '@4',
                'A=D-A',
                'D=M',
                '@R14',
                'M=D',
                '@SP // POP ARG ',
                'A=M-1',
                'D=M',
                '@ARG',
                'A=M',
                'M=D',
                '@ARG // SP = ARG + 1',
                'D=M+1',
                '@SP',
                'M=D',
                '@R13 // RESTORE THAT',
                'A=M',
                'D=M',
                '@THAT',
                'M=D',
                '@R13 // RESTORE THIS',
                'AM=M-1',
                'D=M',
                '@THIS',
                'M=D',
                '@R13 // RESTORE ARG',
                'AM=M-1',
                'D=M',
                '@ARG',
                'M=D',
                '@R13 // RESTORE LCL',
                'AM=M-1',
                'D=M',
                '@LCL',
                'M=D',
                '@R14 // GOTO RETURN',
                'A=M',
                '0;JMP',
            ].join('\n');
    }
}

function parseFile(filePath) {
    const fileName = path.parse(filePath).name
    const lines = fs.readFileSync(filePath, 'utf8').split(/\n|\r\n/);
    const noWhitespaceLines = removeWhitespace(lines);
    return noWhitespaceLines.map(line => parseLine(line, fileName)).join('\n');
}

const {file: fileName, dir: folderName, noInit} = getParsedOptions();

const commandSets = [];

if (!noInit) {
    const initCode = [
        '@256',
        'D=A',
        '@SP',
        'M=D',
        parseLine('call Sys.init 0'),
    ].join('\n');

    commandSets.push(initCode)
}

if (fileName) {
    commandSets.push(parseFile(fileName));
}
if (folderName) {
    files = fs.readdirSync(folderName);
    files.forEach(fileName => {
        if (path.extname(fileName) === '.vm') commandSets.push(parseFile(path.join(folderName, fileName)));
    })
}

const outFileName = (fileName && fileName.split('.')[0]) || folderName;


fs.writeFileSync(`${outFileName}.asm`, commandSets.join("\n"));