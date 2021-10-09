'use strict';

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import BLESensorList from '../components/BLESensorList';
import BLESensorData from '../components/BLESensorData';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
// mock
import { Map } from 'immutable';

const defaultDeviceDefinition = require('../../NordicThingy52.json');

function getSensorList(deviceDefinition) {
    const { services } = deviceDefinition;
    const sensors = [];
    services.forEach(({characteristics}) => {
        characteristics.forEach(characteristic => {
            if(characteristic.function === 'feature')
                sensors.push(characteristic);
        })
    });
    return sensors;
}

class BLESensors extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            view: 'devices'
        };
        this.handleSelectSensor = this.handleSelectSensor.bind(this);
    }

    nav(view) {
        this.setState({
            view
        })
    }

    handleSelectDevice(device) {
        this.setState({
            view: 'device',
            currentDevice: device
        })
    }

    handleSelectSensor(sensor) {
        this.setState({
            view: 'sensor',
            currentSensor: sensor
        })
    }

    render() {
        const { connectedDevices } = this.props;
        const sensors = getSensorList(defaultDeviceDefinition);
        const { view, currentDevice, currentSensor } = this.state;
        const navs = [{
            view: 'devices',
            title: 'Devices'
        }]
        if(view !== 'devices') {
            navs.push({
                view: 'device',
                title: currentDevice.name
            })
            if(view !== 'device')
                navs.push({
                    view: 'sensor',
                    title: currentSensor.name
                })
        }
        navs[navs.length - 1].active = true;
        return (
            <div>
                <Breadcrumb>
                    {navs.map(({view:key,title,active}) => <Breadcrumb.Item active={active || false} onClick={e => this.nav(key,e)}>{title}</Breadcrumb.Item>)}
                </Breadcrumb>
                { view === 'devices' && (connectedDevices && connectedDevices.size > 0 ? connectedDevices.map(device => <div className="ble-sensor-device-list-item" onClick={e => this.handleSelectDevice(device,e)}>{device.name ? device.name : '<Unknown>'}</div>) : 'no device connected') }
                { view === 'device' && <BLESensorList device={currentDevice} sensors={sensors} onSelectSensor={this.handleSelectSensor}/> }
                { view === 'sensor' && <BLESensorData device={currentDevice} sensor={currentSensor}/> }
            </div>
        );
    }
}

function mapStateToProps(state) {
    const { adapter } = state.app;

    const { selectedAdapter } = adapter;

    if (!selectedAdapter) {
        return {
            // mock
            connectedDevices: Map().set('device-id', {
                name: 'device name'
            })
        };
    }

    return {
        connectedDevices: selectedAdapter.connectedDevices,
    };
}

export default connect(mapStateToProps)(BLESensors);

BLESensors.propTypes = {
    connectedDevices: PropTypes.object,
};

BLESensors.defaultProps = {
    connectedDevices: null,
};
