const fs = require('fs');
const nopt = require('nopt');
const path = require('path');
let labelNumber = 0;

function getParsedOptions() {
    const options = {
        'file': path
    }
    const shortHands = {
        'f': ['--file']
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

function parseLine(line) {
    const [command, arg1, arg2] = line.split(' ');
    switch (command) {
        case 'add':
            return [
                '@SP',
                'AM=M-1',
                'D=M',
                'A=A-1',
                'M=D+M'
            ].join('\n');
        case 'sub':
            return [
                '@SP',
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
                        '@LCL',
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
                        '@ARG',
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
                        '@THIS',
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
                        '@THAT',
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
                        '@SP',
                        'AM=M-1',
                        'D=M',
                        `@${+arg2 + 5}`,
                        'M=D'
                    ].join('\n');

            }
        case 'push':
            switch (arg1) {
                case 'constant': {
                    return [
                        `@${arg2}`,
                        'D=A',
                        '@SP',
                        'M=M+1',
                        'A=M-1',
                        'M=D',
                    ].join('\n');
                }
                case 'local':
                    return [
                        '@LCL',
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
                        '@ARG',
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
                        '@THIS',
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
                        '@THAT',
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
                        `@${+arg2 + 5}`,
                        'D=M',
                        '@SP',
                        'M=M+1',
                        'A=M-1',
                        'M=D',
                    ].join('\n');
            }
    }
}

const {file: fileName} = getParsedOptions();
const lines = fs.readFileSync(fileName, 'utf8').split(/\n|\r\n/);
const noWhitespaceLines = removeWhitespace(lines);
const commands = noWhitespaceLines.map(parseLine);
fs.writeFileSync(`${fileName.split('.')[0]}.asm`, commands.join("\n"));