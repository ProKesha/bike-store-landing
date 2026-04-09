const { spawn } = require('child_process');

const parcelArgs = [
  'parcel',
  'serve',
  'src/index.html',
  '--dist-dir',
  '.parcel-dev-dist',
  '--public-url',
  '/',
];

const parcel = spawn('npx', parcelArgs, {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

let hasOpenedBrowser = false;

function getOpenCommand(url) {
  switch (process.platform) {
    case 'darwin':
      return ['open', [url]];
    case 'win32':
      return ['cmd', ['/c', 'start', '', url]];
    default:
      return ['xdg-open', [url]];
  }
}

function tryOpenBrowser(output) {
  if (hasOpenedBrowser) {
    return;
  }

  const match = output.match(/Server running at (http:\/\/[^\s]+)/);

  if (!match) {
    return;
  }

  hasOpenedBrowser = true;

  const [, url] = match;
  const [command, args] = getOpenCommand(url);
  const opener = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  });

  opener.on('error', () => {
    hasOpenedBrowser = false;
  });

  opener.unref();
}

function forwardOutput(stream, target) {
  stream.on('data', chunk => {
    const output = chunk.toString();

    target.write(output);
    tryOpenBrowser(output);
  });
}

forwardOutput(parcel.stdout, process.stdout);
forwardOutput(parcel.stderr, process.stderr);

parcel.on('close', code => {
  process.exit(code ?? 0);
});
