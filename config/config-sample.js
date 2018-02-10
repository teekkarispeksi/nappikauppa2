module.exports = {
  port: 3000,
  public_url: 'http://127.0.0.1:3000/',
  expire_minutes: 15,
  db: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nappikauppa2'
  },
  email: {
    mailgun: {
          api_key: '###',
          domain: ''
        },
    from: '',
    errors_to: ''
  },
  paytrail: {
    user: '13466',
    password: '6pKF4jkv97zmqBJ3ZL8gUw5DfT2NMQ'
  },
  auth: {
    method: 'static',
    groups: {
      admin: 'lippukauppa-admin',
      checker: 'lippukauppa-tarkistin'
    },
    confluence: {
      url: 'http://localhost:3010/groups/'
    },
    static_auth: { //must have _auth, static is reserved word
      //Static authentication configuration
      //Each user has static username, md5 hashed password and group
      users: [
        {
          name: 'admin',
          pass: 'f7f5d28a3221512a9824634e0cd999cb', //nappiadmin5
          group: 'lippukauppa-admin'
        }

      ]
    }
  }
};
