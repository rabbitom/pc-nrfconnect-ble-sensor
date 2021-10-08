'use strict';

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import BLESensorList from '../components/BLESensorList';

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
    render() {
        const { connectedDevices } = this.props;
        const sensors = getSensorList(defaultDeviceDefinition);
        return (
            <div>
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
