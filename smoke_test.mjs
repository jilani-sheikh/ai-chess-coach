import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPosition(engine, fen, depth = 10) {
  return new Promise((resolve) => {
    let bestMove = null;
    let evalLine = null;

    const onData = (data) => {
      const lines = data.toString().split('\n');
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith('info') && line.includes('score')) {
          evalLine = line;
        }
        if (line.startsWith('bestmove')) {
          bestMove = line;
          engine.stdout.off('data', onData);
          resolve({ bestMove, evalLine });
        }
      }
    };

    engine.stdout.on('data', onData);
    engine.stdin.write(`position fen ${fen}\n`);
    engine.stdin.write(`go depth ${depth}\n`);
  });
}

async function smokeTest() {
  console.log('Starting Stockfish 18 multi-position smoke test...');
  const enginePath = path.join(__dirname, 'node_modules', 'stockfish', 'bin', 'stockfish-18-asm.js');
  const engine = spawn(process.execPath, [enginePath]);

  // Wait for isready
  await new Promise((res) => {
    const onData = (data) => {
      if (data.toString().includes('readyok')) {
        engine.stdout.off('data', onData);
        res();
      }
    };
    engine.stdout.on('data', onData);
    engine.stdin.write('uci\n');
    engine.stdin.write('isready\n');
  });

  console.log('Stockfish 18 UCI ready!');

  // Test 1: Standard opening position
  const pos1 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
  console.log('\nTesting Pos 1 (e4):', pos1);
  const res1 = await testPosition(engine, pos1, 10);
  console.log('Result 1:', res1);

  // Test 2: Mate in 1 puzzle (Scholar\'s Mate: 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#)
  const pos2 = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';
  console.log('\nTesting Pos 2 (Mate):', pos2);
  const res2 = await testPosition(engine, pos2, 8);
  console.log('Result 2:', res2);

  // Test 3: Black to move tactical advantage
  const pos3 = 'r1bqk2r/pppp1ppp/2n5/1B2p3/4n3/2PP1N2/P1P2PPP/R1BQK2R b KQkq - 0 6';
  console.log('\nTesting Pos 3 (Black advantage):', pos3);
  const res3 = await testPosition(engine, pos3, 10);
  console.log('Result 3:', res3);

  engine.stdin.write('quit\n');
  engine.kill();
  console.log('\nMulti-position smoke test completed successfully!');
}

smokeTest();
