module.exports = {
    port: 36902, // for production environment
    dev_port: 3000, // for gulp watch
    base_url: 'http://127.0.0.1:3000',
    expire_minutes: 15,
    title: 'Teekkarispeksi 20xx',
    db: {
        host: "localhost",
        user: "root",
        password: "",
        database: "nappikauppa2"
    },
    email: {
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
        url: 'http://localhost:3010/groups/',
        groups: {
            base: 'lippukauppa-admin' // possible to add different user levels later
        }
    }
}
