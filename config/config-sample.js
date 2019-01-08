module.exports = {
  port: 3000,
  public_url: 'http://127.0.0.1:3000/',
  expire_minutes: 15,
  db: {
    host: 'localhost',
    user: 'root',
    password: 'nappikauppa2-test',
    database: 'nappikauppa2-test'
  },
  email: {
    mailgun: {
          api_key: '###',
          domain: ''
        },
    from: '',
    errors_to: '',
    errors_from: ''
  },
  payment: {
    provider: 'checkout-v3',
    'checkout-v3': {
      user: '375917',
      password: 'SAIPPUAKAUPPIAS'
    },
    paytrail: {
      user: '13466',
      password: '6pKF4jkv97zmqBJ3ZL8gUw5DfT2NMQ'
    }
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
    static: {
      //Static authentication configuration
      //Each user has static username, md5 hashed password and groups
      users: [
        {
          name: 'admin',
          pass: '44d6e57b24917d45e2864fccaf9f8c3c', //nappiadmin5
          groups: ['lippukauppa-admin']
        }

      ]
    }
  }
};
