'use strict';

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class BLESensors extends React.PureComponent {
    render() {
        const { connectedDevices } = this.props;
        return (
            <div>
                {connectedDevices && connectedDevices.size > 0 ? connectedDevices.map(device => <div>{device.name ? device.name : '<Unknown>'}</div>) : 'no device connected'}
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
