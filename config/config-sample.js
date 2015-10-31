module.exports = {
    port: 3000,
    public_url: 'http://127.0.0.1:3000/',
    expire_minutes: 15,
    ticket_filename: 'lippu_teekkarispeksi_20xx.pdf',
    title: 'Teekkarispeksi 20xx',
    db: {
        host: "localhost",
        user: "root",
        password: "",
        database: "nappikauppa2"
    },
    email: {
        // these are passed straight to nodemailer
        // https://github.com/andris9/nodemailer-smtp-transport#usage
        // for dev/test check service: 'gmail'
        host: '',
        secure: true,
        auth: {
            user: '',
            pass: ''
        },
        from: ''
    },
    paytrail: {
        user: '13466',
        password: '6pKF4jkv97zmqBJ3ZL8gUw5DfT2NMQ'
    },
    confluence_auth: {
        enabled: true,
        url: 'http://localhost:3010/groups/',
        groups: {
            base: 'lippukauppa-admin' // possible to add different user levels later
        }
    }
}
