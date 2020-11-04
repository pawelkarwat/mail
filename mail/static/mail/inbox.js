document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').onsubmit = () => {
    compose_submit();
    return false;
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#email-content-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-alert').innerHtml = '';
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load mailbox
  emails = null;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);

    const element = document.createElement('div');


    // adding divs for every mail
    for(var i = 0; i < emails.length; i++) {
        const element = document.createElement('div');

        element.setAttribute('id', emails[i].id);
        if(emails[i].read) {
            element.setAttribute('class', 'mail');
        } else {
            element.setAttribute('class', 'mail unread');
        }

        if(mailbox == 'sent') {
            var sender = emails[i].recipients;
        }
        else {
            var sender = emails[i].sender;
        }

        element.innerHTML = `<b>${sender}</b> &nbsp;${emails[i].subject}<div class="time">${emails[i].timestamp}</div>`;
        element.addEventListener('click', mail => mail_clicked(mail, (mailbox === 'sent') ? true : false));
        document.querySelector('#emails-view').append(element);
    }

  });
}

function mail_clicked(mail, is_sent) {
//    console.log(this);
    // ckecking if mail div is clicked
    if(mail.target.children.length === 0) {
        var email_id = mail.target.parentNode.getAttribute('id')
    } else {
        var email_id = mail.target.getAttribute('id');
    }

    console.log(mail);
    console.log(email_id);

    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        console.log(email);
        // template for displaying particular Email
        var emailHTML = `
            <div class="form-group">
            From: <input disabled class="form-control" value="${email.sender}">
            </div>

            <div class="form-group">
            To: <input disabled class="form-control" value="${email.recipients}">
            </div>

            <div class="form-group">
            Subject: <input disabled class="form-control" value="${email.subject}">
            </div>


            Body:  <textarea disabled class="form-control">${email.body}</textarea>


            ${email.timestamp}

            <br/><br/>`;

        if(!is_sent){
            if(email.archived === false) {
                // add archive button
                emailHTML += '<button id="archive" type="button" class="btn btn-primary">Archive</button>';
            } else {
                // add unarchive button
                emailHTML += '<button id="un_archive" type="button" class="btn btn-primary">Unarchive</button>';
            }

            emailHTML += ' &nbsp;<button id="reply" type="button" class="btn btn-primary">Reply</button>';
            document.querySelector('#email-content-view').innerHTML = emailHTML;
            document.querySelector('#reply').addEventListener('click', () => reply(email));

            if(email.archived === false) {
                // add archive click listener
                document.querySelector('#archive').addEventListener('click', () => archive(email_id));
            } else {
                document.querySelector('#un_archive').addEventListener('click', () => un_archive(email_id));
            }
        }
        else {
            document.querySelector('#email-content-view').innerHTML = emailHTML;
        }

        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';
        document.querySelector('#email-content-view').style.display = 'block';


        // making email read
        make_read(email_id)

    });
}


function reply(email) {

   console.log(email);
  // Set composition fields
  document.querySelector('#compose-alert').innerHtml = '';
  document.querySelector('#compose-recipients').value = email.sender;
  if(email.subject.slice(0, 2) === 'Re:'){
    document.querySelector('#compose-subject').value = email.subject;
  } else {
    document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
  }

  document.querySelector('#compose-body').value = 'On ' + email.timestamp + ' ' + email.sender + ' wrote:\n' + email.body;

  // Show compose view and hide other views
  document.querySelector('#email-content-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
}

function make_read(email_id) {
    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });
}

async function archive(email_id) {
    await fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
    });

    load_mailbox('inbox');
}

async function un_archive(email_id) {
    await fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
    });

    load_mailbox('inbox');
}

async function compose_submit() {

    await fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        if(result.error) {
            alert(result.error);
//            document.querySelector('#compose-alert').innerHtml = `
//            <div class="alert alert-danger" role="alert">
//                ${result.error}
//            </div>`;
//            console.log(document.querySelector('#compose-alert').innerHtml);
        }
        else {
            load_mailbox('sent');
        }
    });
}