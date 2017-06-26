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

        api.createReplicatedPodFromApplications('kube-system/kube-dns', 1, [{
            id: 'kubedns',
            image: 'gcr.io/google_containers/kubedns-amd64:1.8',
            memory: 170,
            command: `/kube-dns --dns-port 10053 --kube-master-url http://${host.getApiIP()}:8080`,
            container_port: '10053/udp'
        }, {
            id: 'dns-masq',
            image: 'gcr.io/google_containers/kube-dnsmasq-amd64:1.4.1',
            memory: 50,
            command: 'dnsmasq -d --no-resolv --server 127.0.0.1#10053 --bind-interfaces --interface eth0',
            random_host_port: true,
            container_port: '53/udp'
        }], (res) => {
            console.log('Creating service.');
            api.createService('kube-system/kube-dns', [{ port: 53, protocol: 'UDP' }], [], '240.0.0.10', (err, res) => {
                console.log("Back from create service with: " + err + " " + JSON.stringify(res));
            });
        });
        
    }
}

module.exports = ContainershipKubeDNSPlugin;
