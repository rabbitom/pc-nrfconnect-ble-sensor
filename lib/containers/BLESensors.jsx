'use strict';

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { logger } from 'nrfconnect/core';
import * as AdapterActions from '../actions/adapterActions';
import * as SensorActions from '../actions/sensorActions';
import BLESensorDevice from '../components/BLESensorDevice';
import BLESensorList from '../components/BLESensorList';
import BLESensorData from '../components/BLESensorData';
// mock
import { Map, OrderedMap } from 'immutable';

const defaultDeviceDefinition = require('../../NordicThingy52.json');

function getSensorList(deviceDefinition) {
    const { services } = deviceDefinition;
    const sensors = [];
    services.forEach(({uuid,characteristics}) => {
        characteristics.forEach(characteristic => {
            if(characteristic.function === 'feature')
                sensors.push({
                    ...characteristic,
                    serviceUuid: uuid.replace(/-/g,''),
                    characteristicUuid: characteristic.uuid.replace(/-/g,''),
                });
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
        this.handleSelectDevice = this.handleSelectDevice.bind(this);
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
        });
        logger.info('selected sensor device', device.instanceId);
        const { sensors, devices, addSensor } = this.props;
        const [ sensor ] = getSensorList(defaultDeviceDefinition);
        sensor.id = `${device.instanceId}.sensor.${sensor.name}`;
        logger.info('sensor id', sensor.id);
        logger.info('sensor service', sensor.serviceUuid);
        logger.info('sensor characteristic', sensor.characteristicUuid);
        if(!sensors.has(sensor.id)) {
            logger.info('looking for sensor characteristic');
            const deviceWithDetails = devices.get(device.instanceId);
            const service = deviceWithDetails.children.find(({uuid}) => uuid === sensor.serviceUuid)
            logger.info('service', service ? 'found' : 'not exist');
            if(service) {
                //todo: discover characteristics 
                const characteristic = service.children.find(({uuid}) => uuid === sensor.characteristicUuid);
                logger.info('characteristic', characteristic ? 'found' : 'not exist');
                if(characteristic) {
                    sensor.characteristicId = characteristic.instanceId;
                    addSensor(sensor);
                }
            }
        }
    }

    handleSelectSensor(sensor) {
        this.setState({
            view: 'sensor',
            currentSensor: sensor
        })
    }

    render() {
        const {
            connectedDevices,
            disconnectFromDevice,
            sensors,
        } = this.props;
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
                { view === 'devices' && (connectedDevices && connectedDevices.size > 0 ? connectedDevices.toList().map(device => <BLESensorDevice device={device} onSelectDevice={this.handleSelectDevice} onDisconnectDevice={disconnectFromDevice}/>) : 'no device connected') }
                { view === 'device' && <BLESensorList device={currentDevice} sensors={sensors} onSelectSensor={this.handleSelectSensor}/> }
                { view === 'sensor' && <BLESensorData device={currentDevice} sensor={currentSensor}/> }
            </div>
        );
    }
}

function mapStateToProps(state) {
    const { adapter, sensor } = state.app;

    const { selectedAdapter } = adapter;

    if (!selectedAdapter) {
        return {
            // mock
            connectedDevices: Map().set('device-id', {
                address: 'device:address',
                name: 'device name'
            }),
            devices: OrderedMap(),
            sensors: sensor.sensors,
        };
    }

    return {
        connectedDevices: selectedAdapter.connectedDevices,
        devices: selectedAdapter.deviceDetails && selectedAdapter.deviceDetails.devices,
        sensors: sensor.sensors,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators(AdapterActions, dispatch),
        ...bindActionCreators(SensorActions, dispatch),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(BLESensors);

BLESensors.propTypes = {
    connectedDevices: PropTypes.object,
    disconnectFromDevice: PropTypes.func,
    devices: PropTypes.object,
    sensors: PropTypes.object,
    addSensor: PropTypes.func,
};

BLESensors.defaultProps = {
    connectedDevices: null,
};
