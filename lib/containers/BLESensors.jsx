'use strict';

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import BLESensorList from '../components/BLESensorList';
import Breadcrumb from 'react-bootstrap/Breadcrumb'

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
    }

    render() {
        const { connectedDevices } = this.props;
        const sensors = getSensorList(defaultDeviceDefinition);
        const { view } = this.state;
        const navs = [{
            title: 'Devices'
        }]
        if(view !== 'devices') {
            navs.push({
                title: 'Some Device'
            })
            if(view !== 'device')
                navs.push({
                    title: 'Some Sensor'
                })
        }
        navs[navs.length - 1].active = true;
        return (
            <div>
                <Breadcrumb>
                    {navs.map(({title,active}) => <Breadcrumb.Item active={active || false}>{title}</Breadcrumb.Item>)}
                </Breadcrumb>
                {connectedDevices && connectedDevices.size > 0 ? connectedDevices.map(device => <div>{device.name ? device.name : '<Unknown>'}</div>) : 'no device connected'}
                <BLESensorList sensors={sensors}/>
            </div>
        );
    }
}

function mapStateToProps(state) {
    const { adapter } = state.app;

    const { selectedAdapter } = adapter;

    if (!selectedAdapter) {
        return {};
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
