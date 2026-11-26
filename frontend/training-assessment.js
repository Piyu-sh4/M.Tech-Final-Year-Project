(() => {
  function element(tag, text) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function questionEditor(index) {
    const group = element('fieldset');
    group.append(element('legend', 'Question ' + (index + 1)));
    const prompt = element('input');
    prompt.required = true;
    prompt.maxLength = 400;
    const promptLabel = element('label', 'Prompt');
    promptLabel.append(prompt);
    group.append(promptLabel);
    const correct = element('select');
    const choices = Array.from({ length: 4 }, (_, optionIndex) => {
      const option = element('input');
      option.required = true;
      option.maxLength = 200;
      const label = element('label', 'Option ' + (optionIndex + 1));
      label.append(option);
      group.append(label);
      const selection = element('option', 'Option ' + (optionIndex + 1));
      selection.value = optionIndex;
      correct.append(selection);
      return option;
    });
    const correctLabel = element('label', 'Correct option');
    correctLabel.append(correct);
    group.append(correctLabel);
    return { group, value: () => ({ prompt: prompt.value, choices: choices.map(choice => choice.value), correct: Number(correct.value) }) };
  }

  function questionReader(question, index) {
    const group = element('fieldset');
    group.append(element('legend', (index + 1) + '. ' + question.prompt));
    for (const [choiceIndex, choice] of question.choices.entries()) {
      const option = element('input');
      option.type = 'radio';
      option.required = true;
      option.name = 'answer-' + index;
      option.value = choiceIndex;
      const label = element('label', choice);
      label.prepend(option);
      label.className = 'assessment-option';
      group.append(label);
    }
    return { group, value: () => Number(group.querySelector('input:checked').value) };
  }

  async function open({ row, editor, opener, request, mutate }) {
    const path = '/training/' + (editor ? 'courses/' : 'my/') + encodeURIComponent(row.course_id) + '/assessment';
    const assessment = editor ? null : await request(path);
    const dialog = document.getElementById('record-form');
    const heading = element('h2', editor ? 'Publish assessment' : 'Course assessment');
    heading.id = 'record-form-heading';
    heading.tabIndex = -1;
    const form = element('form');
    form.className = 'assessment-form';
    const instructions = element('p', editor ?
      'Write 15 to 20 questions with four choices each. Published questions are fixed so every learner is graded on the same material.' :
      'Choose one answer for each question. A score of ' + assessment.passing_percentage + '% is required.');
    const list = element('div');
    list.className = 'assessment-questions';
    const questions = editor ? Array.from({ length: 15 }, (_, index) => questionEditor(index)) :
      assessment.questions.map(questionReader);
    list.append(...questions.map(question => question.group));
    const error = element('p');
    error.className = 'form-error';
    error.setAttribute('role', 'alert');
    const controls = element('div');
    controls.className = 'form-actions';
    if (editor) {
      const add = element('button', 'Add question');
      const remove = element('button', 'Remove last question');
      add.type = remove.type = 'button';
      remove.disabled = true;
      add.addEventListener('click', () => {
        const question = questionEditor(questions.length);
        questions.push(question);
        list.append(question.group);
        add.disabled = questions.length === 20;
        remove.disabled = false;
        question.group.querySelector('input').focus();
      });
      remove.addEventListener('click', () => {
        questions.pop().group.remove();
        remove.disabled = questions.length === 15;
        add.disabled = false;
        add.focus();
      });
      controls.append(add, remove);
    }
    const cancel = element('button', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', () => dialog.close());
    const submit = element('button', editor ? 'Publish assessment' : 'Submit answers');
    submit.type = 'submit';
    submit.className = 'primary';
    controls.append(cancel, submit);
    form.append(instructions, list, error, controls);
    form.addEventListener('submit', event => {
      event.preventDefault();
      error.textContent = '';
      const values = questions.map(question => question.value());
      mutate(submit, {
        path, method: editor ? 'PUT' : 'POST', payload: editor ? { questions: values } : { answers: values },
      }, 'Assessment saved.', () => dialog.close(), message => { error.textContent = message; });
    });
    dialog.replaceChildren(heading, element('p', row.title), form);
    dialog.addEventListener('close', () => {
      (opener.isConnected ? opener : document.getElementById('search')).focus();
    }, { once: true });
    dialog.showModal();
    heading.focus();
  }

  function confirmCertificate({ row, opener, options, mutate }) {
    const submit = element('button', 'Confirm issue');
    submit.type = 'button';
    submit.className = 'primary';
    const error = element('p');
    error.setAttribute('role', 'alert');
    error.className = 'form-error';
    const picker = element('select');
    for (const [value,text] of [['classic','Classic'],['modern','Modern'],['course','Course colors']]) {
      const option = element('option',text); option.value = value; picker.append(option);
    }
    const template = element('label','Certificate template');
    template.append(picker);
    submit.addEventListener('click', () => {
      error.textContent = '';
      mutate(submit, {...options,payload:{...options.payload,template:picker.value}}, 'Certificate issued.',
        () => submit.closest('dialog').close(), message => { error.textContent = message; });
    });
    WorkforceRecords.show('Issue certificate', [
      ['Learner', row.full_name],
      ['Course', row.title],
      ['Review', 'Confirm the learner’s completion before issuing the Workforce Intelligence certificate.'],
    ], [submit], opener);
    submit.closest('.form-actions').before(template);
    submit.closest('dialog').append(error);
  }

  window.WorkforceAssessment = { open, confirmCertificate };
})();
