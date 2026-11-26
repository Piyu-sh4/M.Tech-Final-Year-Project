window.WorkforceFinance = (() => {
  const node = (tag,text) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const rupees = value => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(value) || 0);
  const external = (label,url) => {
    const link = node('a',label + ' ↗');
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.className = 'action-link';
    return link;
  };
  function section(title,description) {
    const card = node('section'); card.className = 'finance-card';
    card.append(node('h2',title),node('p',description));
    return card;
  }
  function field(form,label,name,type,value,options) {
    const wrapper = node('label',label);
    const input = node(options ? 'select' : 'input');
    input.name = name; input.required = true;
    if (options) for (const option of options) {
      const item = node('option',option); item.value = option; input.append(item);
    } else input.type = type;
    if (type === 'number') { input.min = '0'; input.step = 'any'; input.inputMode = 'decimal'; }
    input.value = value ?? '';
    wrapper.append(input); form.append(wrapper);
    return input;
  }
  function submit(form,label,work) {
    const button = node('button',label); button.type = 'submit'; button.className = 'primary';
    const output = node('p'); output.setAttribute('role','status'); output.setAttribute('aria-live','polite');
    form.append(button,output);
    form.addEventListener('submit',async event => {
      event.preventDefault(); button.disabled = true; output.textContent = 'Working…';
      try { output.textContent = await work(Object.fromEntries(new FormData(form))); }
      catch (error) { output.textContent = error.message; }
      finally { button.disabled = false; }
    });
  }
  function metrics(parent,values) {
    const list = node('dl'); list.className = 'finance-metrics';
    for (const [label,value] of values) {
      const item = node('div'); item.append(node('dt',label),node('dd',value)); list.append(item);
    }
    parent.replaceChildren(list);
  }
  let tools;
  async function mount(context) {
    const {current,request} = context;
    tools = context;
    if (!['tax-portal','loan-portal','credit-score','bank-directory'].includes(current.slug)) return;
    const grid = node('div'); grid.className = 'finance-grid';
    document.querySelector('#workspace .records-surface').before(grid);
    if (current.slug === 'tax-portal') {
      const filing = section('File your income tax return','Open the Income Tax Department portal to file, pay tax, or view your return. Use the declaration register below for payroll review.');
      filing.append(external('Income tax filing and payment','https://www.incometax.gov.in/iec/foportal/'),
        external('Sign in to e-Filing','https://eportal.incometax.gov.in/iec/foservices/#/login'));
      const card = section('Estimate salary tax','For resident individuals under 60 with ordinary salary income up to ₹50 lakh. Other income categories and final filing use the official calculator.');
      const form = node('form'); form.className = 'finance-form';
      const now = new Date(); const year = now.getFullYear() - (now.getMonth() < 3 ? 1 : 0);
      field(form,'Financial year for estimate','financial_year','text',year + '-' + String(year+1).slice(-2),['2026-27','2025-26','2024-25']);
      field(form,'Tax regime for estimate','regime','text','new',['new','old']);
      field(form,'Annual salary for estimate','gross_income','number',900000);
      const result = node('div');
      submit(form,'Estimate tax',async payload => {
        const data = await request('/tax/calculate',{method:'POST',payload});
        metrics(result,[['Taxable income',rupees(data.taxable_income)],['Annual tax',rupees(data.tax_payable)],['Monthly TDS estimate',rupees(data.monthly_tds)],['Rebate and marginal relief',rupees(data.rebate+data.marginal_relief)]]);
        return 'Estimate ready. Eligible deductions can be entered in your payroll declaration.';
      });
      card.append(form,result,external('Official tax calculator','https://eportal.incometax.gov.in/iec/foservices/#/TaxCalc/calculator'));
      filing.append(external('How to download a filed or revised return','https://www.incometax.gov.in/iec/foportal/help/how-to-know-the-itr-status'));
      const summary = section('Annual payroll summary','Download your recorded paid salary and declaration totals for the financial year.');
      const summaryForm = node('form');
      summaryForm.className = 'finance-form';
      field(summaryForm,'Financial year for summary','financial_year','text',year + '-' + String(year+1).slice(-2));
      submit(summaryForm,'Download annual summary PDF',async payload=>{
        const data = await request('/tax/tds-summary?fy='+encodeURIComponent(payload.financial_year));
        if (!data.salary_history.length && !data.declaration) throw Error('No payroll or declaration records for this year.');
        const fields = [['Financial year',data.financial_year],['Recorded TDS',data.declaration?rupees(data.declaration.tds_deducted):'Unavailable'],['Declared tax liability',data.declaration?rupees(data.declaration.tax_liability):'Unavailable']];
        for (const salary of data.salary_history) fields.push([salary.month_year,'Net pay '+rupees(salary.net_salary)+' · Base pay '+rupees(salary.basic_salary)]);
        const pdf = await request('/record-pdf',{method:'POST',blob:true,payload:{title:'Annual payroll summary · '+data.financial_year,fields}});
        const url = URL.createObjectURL(pdf);
        const link = node('a');
        link.href = url;
        link.download = 'annual-payroll-'+data.financial_year+'.pdf';
        link.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
        return 'Annual payroll summary downloaded.';
      });
      summary.append(summaryForm);
      grid.append(summary);
      grid.append(filing,card);
    }
    if (current.slug === 'loan-portal') {
      const card = section('Employee loan eligibility','Check your company policy limit before applying. Bank applications use each lender’s assessment and application process.');
      const result = node('div'); const output = node('p'); output.setAttribute('role','status');
      const refresh = node('button','Check eligibility'); refresh.type = 'button';
      const check = async () => {
        refresh.disabled = true;
        try {
          const data = await request('/loans/eligibility');
          metrics(result,[['Monthly salary',rupees(data.monthly_salary)],['Company principal limit',rupees(data.max_loan_amount)],
            ['Monthly EMI limit',rupees(data.max_monthly_emi)],['Employment tenure',(data.tenure_months ?? 0) + ' months']]);
          output.textContent = data.eligible ? 'You can apply within these limits, subject to company review.' : data.reasons.join(' ');
        } catch (error) { output.textContent = error.message; }
        finally { refresh.disabled = false; }
      };
      refresh.addEventListener('click',check);
      document.addEventListener('workforce:records-loaded',check);
      card.append(result,output,refresh);
      const calculator = section('Plan your repayment','The estimate uses the company rate for the chosen loan type.');
      const form = node('form'); form.className = 'finance-form';
      field(form,'Amount for EMI estimate','principal','number',100000);
      const term = field(form,'Months for EMI estimate','tenure_months','number',12); term.min = '1'; term.max = '84'; term.step = '1';
      field(form,'Type for EMI estimate','loan_type','text','personal',['personal','home','bike','car','vehicle','education','marriage','medical','emergency']);
      const detail = node('div');
      submit(form,'Calculate EMI',async payload => {
        const data = await request('/loans/calculate-emi',{method:'POST',payload});
        metrics(detail,[['Monthly EMI',rupees(data.emi)],['Annual company rate',data.annual_rate + '%'],['Estimated total',rupees(data.total)],['Estimated interest',rupees(data.interest)]]);
        return 'Estimate ready. The final installment adjusts rounding.';
      });
      calculator.append(form,detail); grid.append(card,calculator); await check();
    }
    if (current.slug === 'credit-score') {
      const card = section('Get your credit report','Open your credit bureau’s official portal, then optionally save your reported score here with its date.');
      for (const [label,url] of [
        ['CIBIL report','https://www.cibil.com/freecibilscore'],
        ['Experian report','https://www.experian.in/consumer/consumer-services/'],
        ['Equifax report','https://www.equifax.co.in/support/free-credit-report'],
        ['CRIF High Mark report','https://www.crifhighmark.com/']
      ]) card.append(external(label,url));
      const score = section('Your self-reported score','Scores saved here are entered by you. Your lender checks the bureau report during its own approval process.');
      const saved = await request('/loans/credit-profile');
      const form = node('form'); form.className = 'finance-form';
      field(form,'Credit bureau','bureau','text',saved?.bureau || 'CIBIL',['CIBIL','Experian','Equifax','CRIF High Mark']);
      const input = field(form,'Credit score','score','number',saved?.score); input.min = '300'; input.max = '900'; input.step = '1';
      const date = field(form,'Credit report date','checked_on','date',saved?.checked_on?.slice(0,10) || new Date().toISOString().slice(0,10));
      date.max = new Date().toISOString().slice(0,10);
      submit(form,'Save reported score',async payload => (await request('/loans/credit-profile',{method:'PUT',payload})).message);
      score.append(form); grid.append(card,score);
    }
    if(['loan-portal','credit-score','bank-directory'].includes(current.slug)){
      const banks=await request('/loans/bank-partners');
      const applications=section('Apply with your bank','Personal, home, two-wheeler and car loans use each bank’s own application and credit assessment. Your saved score is self-reported, not a bureau verification or approval.');
      for(const name of ['State Bank of India','HDFC','Axis','Central Bank of India']){const bank=banks.find(bank=>bank.name.toLowerCase().includes(name.toLowerCase()));if(bank)applications.append(external(bank.name,bank.website_url));}
      applications.append(external('Browse all bank websites','/bank-directory.html'));grid.append(applications);
    }
    if (current.slug === 'bank-directory') {
      const card = section('Find a bank and apply','Search the directory by bank name or category. Each bank link opens its official website, where you can check available loans, eligibility, documents, and application options.');
      card.append(external('RBI directory of bank websites','https://www.rbi.org.in/scripts/banklinks.aspx'),
        external('SBI personal loan applications','https://sbi.bank.in/web/personal-banking/loans/personal-loans'));
      grid.append(card);
    }
  }
  async function showRepayments(loan) {
    const {request,currentUser,load} = tools;
    const opener = document.activeElement;
    const panel = node('dialog'); panel.className = 'repayment-dialog';
    const heading = node('h2','Repayments for loan #' + loan.loan_id); heading.id = 'repayment-heading';
    panel.setAttribute('aria-labelledby',heading.id);
    const list = node('ol'); list.className = 'repayment-list';
    const output = node('p'); output.setAttribute('role','status');
    const settlement = node('div');
    const close = node('button','Close repayments'); close.type = 'button'; close.addEventListener('click',() => panel.close());
    panel.append(heading,output,list,settlement,close); document.body.append(panel); panel.showModal();
    panel.addEventListener('close',() => { panel.remove(); if (opener.isConnected) opener.focus(); else document.getElementById('search').focus(); },{once:true});
    const refresh = async () => {
      const rows = await request('/loans/' + loan.loan_id + '/repayments' + ([1,3,4].includes(currentUser.role_id) ? '' : '/my'));
      list.replaceChildren();
      for (const row of rows) {
        const item = node('li');
        item.append(node('strong','Installment ' + row.installment_no),node('span',String(row.due_date).slice(0,10)),
          node('span',rupees(row.amount_due ?? row.emi_amount) + ' · ' + row.status));
        if ([1,4].includes(currentUser.role_id) && loan.user_id !== currentUser.user_id && row.status !== 'paid' && loan.status === 'disbursed') {
          const pay = node('button','Record installment ' + row.installment_no + ' paid'); pay.type = 'button';
          pay.addEventListener('click',async () => {
            pay.disabled = true;
            try {
              const result = await request('/loans/repayments/' + row.repayment_id + '/paid',{method:'PATCH',payload:{}});
              await refresh();
              await load(false);
              output.textContent = result.message;
            } catch (error) { output.textContent = error.message; pay.disabled = false; }
          });
          item.append(pay);
        }
        list.append(item);
      }
      if (!rows.length) list.append(node('li','A repayment schedule is created when disbursement is recorded.'));
      settlement.replaceChildren();
      if (currentUser.role_id === 1 && loan.user_id !== currentUser.user_id && loan.status === 'disbursed' && rows.some(row => row.status !== 'paid')) {
        const quote = await request('/loans/' + loan.loan_id + '/foreclose');
        settlement.append(node('p','Outstanding principal for full settlement ' + rupees(quote.outstanding_principal)));
        const confirm = node('button','Record full settlement'); confirm.type = 'button';
        confirm.addEventListener('click',async () => {
          confirm.disabled = true;
          try {
            const result = await request('/loans/' + loan.loan_id + '/foreclose',
              {method:'POST',payload:{confirm:true,expected_amount:quote.outstanding_principal}});
            await refresh();
            await load(false);
            output.textContent = result.message;
          } catch (error) { output.textContent = error.message; confirm.disabled = false; }
        });
        settlement.append(confirm);
      }
    };
    try { await refresh(); } catch (error) { output.textContent = error.message; }
  }
  async function showExitSettlement(resignation, opener) {
    const {request} = tools;
    const userId = resignation.user_id;
    const panel = node('dialog');
    panel.className = 'repayment-dialog';
    const heading = node('h2','Final settlement');
    heading.id = 'exit-settlement-heading';
    panel.setAttribute('aria-labelledby',heading.id);
    const output = node('p');
    output.setAttribute('role','status');
    const summary = node('div');
    const actions = node('div');
    const close = node('button','Close settlement');
    close.type = 'button';
    close.addEventListener('click',()=>panel.close());
    panel.append(heading,output,summary,actions,close);
    document.body.append(panel);
    panel.showModal();
    panel.addEventListener('close',()=>{
      panel.remove();
      (opener.isConnected ? opener : document.getElementById('search')).focus();
    },{once:true});
    const refresh = async () => {
      const settlement = await request('/exit/fnf/'+userId);
      const values = [
        ['Employee',resignation.full_name], ['Status',settlement.status],
        ['Pro-rated salary',rupees(settlement.components?.pro_rata_salary)],
        ['Leave encashment',rupees(settlement.components?.leave_encashment)],
        ['Gratuity',rupees(settlement.components?.gratuity)],
        ['Loan balance',rupees(settlement.deductions?.loan_outstanding)],
        ['Settlement balance',rupees(settlement.approved_amount ?? settlement.net_fnf)],
      ];
      if (settlement.payment_reference) values.push(['Payment reference',settlement.payment_reference]);
      metrics(summary,values);
      actions.replaceChildren();
      if (settlement.status === 'disbursed') return;
      const form = node('form');
      form.className = 'finance-form';
      if (settlement.status === 'calculated') {
        submit(form,'Approve settlement',async () => {
          const result = await request('/exit/fnf/approve',{method:'POST',payload:{user_id:userId,approved_amount:settlement.net_fnf}});
          await refresh();
          output.textContent = result.message;
          return result.message;
        });
      } else {
        const reference = field(form,'Payment reference','reference','text');
        reference.maxLength = 100;
        submit(form,'Record settlement payment',async payload => {
          const result = await request('/exit/fnf/disburse',{method:'POST',payload:{...payload,user_id:userId}});
          await refresh();
          output.textContent = result.message;
          return result.message;
        });
      }
      actions.append(form);
    };
    try { await refresh(); } catch (error) { output.textContent = error.message; }
  }

  return {mount,showRepayments,showExitSettlement};
})();
