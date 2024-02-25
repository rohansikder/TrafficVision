import React from 'react';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { GoogleMap, LoadScript, StandaloneSearchBox, Marker } from '@react-google-maps/api';

// Styles for visually hidden input for accessibility
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

// Container styling for centered layout
const CenteredContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    height: '100vh',
});

const libraries = ['places']; // Required for places input (autocomplete)

const mapContainerStyle = {
    height: '400px',
    width: '800px'
};

class UploadPage extends React.Component {
    state = {
        uploadStatus: null, // Track the upload status
        selectedAddress: null, // Store the selected address from search
        mapCenter: {
            lat: 53.349805, // Default center of the map
            lng: -6.26031
        },
        markerPosition: null, // Store marker position for user-selected location
        coordinates: null // For development purposes, display the marker coordinates
    };

    onSearchBoxLoaded = ref => {
        this.searchBox = ref;
    };

    onPlacesChanged = () => {
        const places = this.searchBox.getPlaces();
        if (places && places.length > 0) {
            const location = places[0].geometry.location;
            this.setState({
                selectedAddress: places[0]?.formatted_address || 'No address selected',
                mapCenter: {
                    lat: location.lat(),
                    lng: location.lng()
                },
                markerPosition: {
                    lat: location.lat(),
                    lng: location.lng()
                },
                coordinates: `Lat: ${location.lat()}, Lng: ${location.lng()}` // Update coordinates for dev purposes
            });
        }
    };

    onMapClick = (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        this.setState({
            markerPosition: { lat, lng },
            mapCenter: { lat, lng },
        });

        this.updateAddressFromCoordinates(lat, lng);
    };

    onMarkerDragEnd = (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();

        this.setState({
            markerPosition: { lat: newLat, lng: newLng },
            mapCenter: { lat: newLat, lng: newLng },
        });

        this.updateAddressFromCoordinates(newLat, newLng);
    };


    renderMap() {
        return (
            <LoadScript
                googleMapsApiKey="AIzaSyBJ39gTzB4yRuN_JTevio4hEcJYSgM8B3o"
                libraries={libraries}
            >
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={this.state.mapCenter}
                    zoom={10}
                    onClick={this.onMapClick} // Allow user to click on the map to drop a pin
                >
                    <StandaloneSearchBox
                        onLoad={this.onSearchBoxLoaded}
                        onPlacesChanged={this.onPlacesChanged}
                    >
                        <input
                            type="text"
                            placeholder="Search for places..."
                            style={{
                                boxSizing: `border-box`,
                                border: `1px solid transparent`,
                                width: `240px`,
                                height: `32px`,
                                padding: `0 12px`,
                                borderRadius: `3px`,
                                boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
                                fontSize: `14px`,
                                outline: `none`,
                                textOverflow: `ellipses`,
                                position: "absolute",
                                left: "50%",
                                marginLeft: "-120px"
                            }}
                        />
                    </StandaloneSearchBox>
                    {this.state.markerPosition && (
                        <Marker
                            position={this.state.markerPosition} // Show marker at selected or clicked location
                            draggable={true} // Allow marker to be draggable
                            onDragEnd={this.onMarkerDragEnd} // Update location upon dragging
                        />
                    )}
                </GoogleMap>
            </LoadScript>
        );
    }

    updateAddressFromCoordinates = (lat, lng) => {
        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK') {
                if (results[0]) {
                    this.setState({
                        selectedAddress: results[0].formatted_address,
                        coordinates: `Lat: ${lat}, Lng: ${lng}`,
                    });
                } else {
                    console.log('No results found');
                    this.setState({
                        selectedAddress: 'No address found',
                    });
                }
            } else {
                console.log('Geocoder failed due to: ' + status);
                this.setState({
                    selectedAddress: 'Failed to get address',
                });
            }
        });
    };


    render() {
        return (
            <CenteredContainer>
                {this.renderMap()}
                <Button
                    component="label"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                >
                    Upload Video
                    <VisuallyHiddenInput
                        type="file"
                        accept="video/*"
                        onChange={this.handleVideoUpload} // Handle file selection for upload
                    />
                </Button>
                {this.state.uploadStatus && (
                    <p style={{ color: this.state.uploadStatus === 'success' ? 'green' : 'red' }}>
                        {this.state.uploadStatus === 'success'
                            ? 'Video uploaded successfully!'
                            : 'Error uploading video. Please try again.'}
                    </p>
                )}
                {this.state.selectedAddress && (
                    <p>Selected Address: {this.state.selectedAddress}</p> // Display the selected address or coordinates for dev purposes
                )}
                {this.state.coordinates && (
                    <p>Coordinates: {this.state.coordinates}</p> // Display the current coordinates for development purposes
                )}
            </CenteredContainer>
        );
    }

    handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (!file) {
            this.setState({ uploadStatus: null });
            return;
        }

        const formData = new FormData();
        formData.append('file', file); // Add the video file to the form data
        if (this.state.selectedAddress) {
            formData.append('address', this.state.selectedAddress); // Include the selected address if available
            // Also include the coordinates
            formData.append('latitude', this.state.markerPosition.lat.toString());
            formData.append('longitude', this.state.markerPosition.lng.toString());
        }

        // Perform the upload via axios
        axios.post('http://127.0.0.1:5000/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
            .then((response) => {
                console.log('Video, address, and coordinates uploaded successfully', response.data);
                this.setState({ uploadStatus: 'success' }); // Update upload status on success
            })
            .catch((error) => {
                console.error('Error uploading video, address, and coordinates', error);
                this.setState({ uploadStatus: 'error' }); // Update upload status on failure
            });
    };
}

export default UploadPage;