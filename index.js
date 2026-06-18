#!/usr/bin/env node
const { prepareDraftPack, parseArgs: parsePrepareArgs } = require('./prepare');
const { createHandoff, parseArgs: parseHandoffArgs } = require('./handoff');
const { runMbsDraft, parseArgs: parseMbsDraftArgs, printMbsDraftHelp } = require('./mbs-draft');
const { initConfig, parseArgs: parseConfigArgs } = require('./config');
const { runDoctor, parseArgs: parseDoctorArgs } = require('./doctor');
const { installSkillToHermes, parseArgs: parseInstallSkillArgs } = require('./install-skill');

const COMMANDS = new Set(['init', 'prepare', 'handoff', 'mbs-draft', 'doctor', 'install-skill']);

function printHelp() {
  console.log('Usage: draftforge <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  init       Create an onboarding config template');
  console.log('  prepare    Build a local draft pack');
  console.log('  handoff    Zip a prepared pack for manual review/upload');
  console.log('  mbs-draft  Guarded Meta Business Suite draft assist');
  console.log('  doctor     Check dependencies, config, source, audio, and MBS readiness');
  console.log('  install-skill  Install DraftForge skill to Hermes skills dir');
  console.log('');
  console.log('Examples:');
  console.log('  draftforge init --out ./draftforge.config.json');
  console.log('  draftforge doctor --config ./draftforge.config.json');
  console.log('  draftforge prepare --source folder --media ./media --out ./pack');
  console.log('  draftforge handoff --pack ./pack --out ./draftforge-handoff.zip');
  console.log('  draftforge mbs-draft --manifest ./pack/manifest.json --dry-run');
}

async function runDraftForgeCli(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h' || (command === 'help' && rest.length === 0)) {
    printHelp();
    return { command: 'help', result: { status: 'ok' } };
  }

  if (command === 'help' && rest[0] === 'mbs-draft') {
    printMbsDraftHelp();
    return { command: 'mbs-draft-help', result: { status: 'ok' } };
  }

  if (!COMMANDS.has(command)) {
    throw new Error(`Unknown DraftForge command: ${command}`);
  }

  if (command === 'mbs-draft' && (rest.includes('--help') || rest.includes('-h'))) {
    printMbsDraftHelp();
    return { command: 'mbs-draft-help', result: { status: 'ok' } };
  }

  if (command === 'init') {
    return { command, result: initConfig(parseConfigArgs(rest)) };
  }

  if (command === 'doctor') {
    return { command, result: runDoctor(parseDoctorArgs(rest)) };
  }

  if (command === 'install-skill') {
    return { command, result: installSkillToHermes(parseInstallSkillArgs(rest)) };
  }

  if (command === 'prepare') {
    const result = await prepareDraftPack(parsePrepareArgs(rest));
    return { command, result: { outDir: result.outDir, cards: result.manifest.cards.length } };
  }

  if (command === 'handoff') {
    return { command, result: createHandoff(parseHandoffArgs(rest)) };
  }

  const result = await runMbsDraft(parseMbsDraftArgs(rest));
  return { command, result };
}

if (require.main === module) {
  runDraftForgeCli()
    .then((payload) => {
      if (!payload.command.endsWith('help')) console.log(JSON.stringify(payload, null, 2));
    })
    .catch((error) => {
      console.error(error.stack || error.message || String(error));
      process.exit(1);
    });
}

module.exports = { runDraftForgeCli };
