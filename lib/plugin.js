const _ = require('lodash');
const request = require('request');
const { ContainershipPlugin, ApiBuilder } = require('@containership/containership.plugin');

class ContainershipKubeDNSPlugin extends ContainershipPlugin {

    constructor() {

        super({
            name: 'k8s_internal-dns',
            description: 'A plugin to setup kube-dns.',
            types: ['core']
        });

    }

    startLeader(host) {
        super.startLeader(host);

        console.log('Start leader in KubeDNS Plugin.');

        const api = host.getApi();

        api.createReplicatedPodFromCSApplications('kube-system/kube-dns', [{
            id: 'kubedns',
            image: 'gcr.io/google_containers/kubedns-amd64:1.8',
            memory: 170,
            command: `/kube-dns --dns-port 10053 --kube-master-url http://${host.getApiIp()}:8080`,
            container_port: '10053/udp'
        }, {
            id: 'dns-masq',
            image: 'gcr.io/google_containers/kube-dnsmasq-amd64:1.4.1',
            memory: 50,
            command: 'dnsmasq -d --no-resolv --server 127.0.0.1#10053 --bind-interfaces --interface eth0',
            random_host_port: true,
            container_port: '53/udp'
        }], (err, res) => {

            if(err) {
                return console.log('Error creating Replicated Pod in dns service.');
            }

            console.log('Creating service.');
            api.createService(_.set({}, 'metadata.name', 'kube-dns'),
                [{ containerPort: 53, protocol: 'UDP' }], undefined, (err, res) => {
                    console.log(`Creating k8s dns service with error ${err} and res ${res}.`);
                });
        });
        
    }
}

module.exports = ContainershipKubeDNSPlugin;
