// The first option in each source row is correct. Rotate it when building the assessment.
const courseQuestions = {
  'JavaScript foundations': [
    ['Which declaration creates a block-scoped variable that can be reassigned?', 'let', 'const', 'var', 'function'],
    ['What does Object.keys() return for an ordinary object?', 'An array of its own enumerable string property names', 'Its property values', 'Only inherited property names', 'A copy of its prototype'],
    ['Which array method transforms each item and returns a new array?', 'map()', 'push()', 'find()', 'includes()'],
    ['Which array method returns the first item matching a predicate?', 'find()', 'every()', 'filter()', 'join()'],
    ['Which comparison checks equality without type coercion?', '===', '==', '=', '!='],
    ['What is the type of the value returned by an async function?', 'A Promise', 'A string', 'Always undefined', 'A generator'],
    ['How do you handle an exception thrown by an awaited operation inside an async function?', 'Place the await in a try block with a catch clause', 'Place the await inside an if condition', 'Call JSON.parse on the Promise', 'Use an array spread'],
    ['Which syntax can interpolate an expression inside a template literal?', '${expression}', '{:expression}', '%expression%', '[[expression]]'],
    ['Which operator uses a fallback only when the left side is null or undefined?', '??', '||', '&&', '==='],
    ['Which DOM API attaches a click listener without replacing existing listeners?', 'addEventListener()', 'getAttribute()', 'querySelector()', 'append()'],
    ['Which DOM property inserts user-provided plain text as text?', 'textContent', 'innerHTML', 'outerHTML', 'srcdoc'],
    ['What does JSON.parse() do with a valid JSON object string?', 'Returns the corresponding JavaScript value', 'Creates a JSON string from the input', 'Returns an HTML node', 'Always returns an array'],
    ['Which expression makes a shallow copy of an array named items?', '[...items]', '[items]', 'items.pop()', 'items.reverse()'],
    ['How does const affect an array assigned to a variable?', 'The variable cannot be reassigned, but the array can be changed', 'The array becomes immutable', 'The array must be empty', 'The variable can only be reassigned once'],
    ['Which method combines matching elements into an array without changing the original?', 'filter()', 'splice()', 'sort()', 'pop()'],
  ],
  'Python foundations': [
    ['Which built-in collection is mutable and preserves item order?', 'list', 'tuple', 'frozenset', 'str'],
    ['Which expression creates an empty dictionary?', '{}', '[]', '()', 'set()'],
    ['What values does list(range(3)) contain?', '[0, 1, 2]', '[1, 2, 3]', '[0, 1, 2, 3]', '[3]'],
    ['What does items[-1] select from a nonempty list?', 'Its last item', 'Its first item', 'A copy of the list', 'Its length'],
    ['What does dict.get(key, fallback) return for a missing key?', 'fallback', 'The key', 'An empty dictionary', 'A KeyError'],
    ['Which operation adds an item at the end of a list?', 'append()', 'keys()', 'strip()', 'split()'],
    ['What separates the body of an if statement from following statements?', 'Its indentation level', 'A closing curly brace', 'An end keyword', 'A semicolon'],
    ['Which statement assigns a local alias when importing a module?', 'import module as alias', 'from alias use module', 'alias require module', 'export module as alias'],
    ['Which keyword defines a regular function?', 'def', 'func', 'function', 'declare'],
    ['What does the with statement commonly do when used with open()?', 'Closes the file when the block exits', 'Keeps the file open until reboot', 'Automatically deletes the file', 'Loads the file into a list'],
    ['Which clause catches an exception raised in a try block?', 'except', 'else', 'finally', 'raise'],
    ['What does the in operator test against a dictionary by default?', 'Membership among the keys', 'Membership among the values', 'Whether the dictionary is empty', 'Whether the dictionary is sorted'],
    ['What value does len("hello") return?', '5', '4', '6', '0'],
    ['Which expression iterates over both keys and values of a dictionary named data?', 'data.items()', 'data.keys()', 'data.values()', 'enumerate(data.values())'],
    ['Which operator performs floor division?', '//', '/', '%', '**'],
  ],
  'Docker and containers': [
    ['What is a Docker image?', 'A packaged filesystem and configuration used to create containers', 'A running process', 'A named network', 'A persistent database volume'],
    ['Which command creates and starts a container from an image?', 'docker run', 'docker build', 'docker logs', 'docker volume ls'],
    ['Which Dockerfile instruction selects the base image?', 'FROM', 'COPY', 'RUN', 'CMD'],
    ['Which Dockerfile instruction copies a local source file into the image?', 'COPY', 'EXPOSE', 'WORKDIR', 'USER'],
    ['Which instruction sets the default command run in the container?', 'CMD', 'ARG', 'LABEL', 'FROM'],
    ['What can preserve database files when a container is replaced?', 'A named volume mounted at the database data directory', 'A container name alone', 'A port mapping alone', 'An image tag alone'],
    ['Which command builds and starts services in a Compose project?', 'docker compose up --build', 'docker compose logs', 'docker compose config', 'docker compose stop'],
    ['How do Compose services normally address each other on their shared network?', 'By service name', 'By their image filenames', 'By their Dockerfile labels', 'By their host process IDs'],
    ['Which command displays the recent logs of a Compose service named api?', 'docker compose logs --tail 50 api', 'docker compose build api', 'docker compose pull api', 'docker compose port api 50'],
    ['What is the purpose of a .dockerignore file?', 'Exclude matching files from the build context', 'Prevent container logging', 'Prevent port publishing', 'Delete named volumes'],
    ['What does a container health check report?', 'The result of a configured readiness or health command', 'How many source files have changed', 'How many image layers Docker cached', 'The number of published ports'],
    ['Which command lists containers in the current Compose project?', 'docker compose ps', 'docker images', 'docker volume ls', 'docker builder prune'],
    ['Which Dockerfile feature can keep build tools out of the final image?', 'A multi-stage build', 'An image label', 'A network alias', 'A longer container name'],
    ['In a mapping of 8080:80, which port belongs to the container?', '80', '8080', '443', '22'],
    ['What is the effect of docker compose down without the volume-removal option on project named volumes?', 'It retains them', 'It empties them', 'It snapshots them automatically', 'It merges them with anonymous volumes'],
  ],
};

module.exports = Object.fromEntries(Object.entries(courseQuestions).map(([title, questions]) => [
  title,
  questions.map(([prompt, answer, ...choices], index) => {
    const correct = index % 4;
    choices.splice(correct, 0, answer);
    return { prompt, choices, correct };
  }),
]));
