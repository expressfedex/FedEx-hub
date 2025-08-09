document.addEventListener('DOMContentLoaded', function() {
    // Check if a token exists. If not, redirect to login.
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'admin_login.html';
        return;
    }

    // DOM Elements
    const mainContent = document.getElementById('main-content');
    const dashboardSection = document.getElementById('dashboard-section');
    const manageTrackingSection = document.getElementById('manage-tracking-section');
    const userManagementSection = document.getElementById('user-management-section');
    const trackingForm = document.getElementById('createTrackingForm');
    const trackingTableBody = document.getElementById('trackingTableBody');
    const trackingIdSelect = document.getElementById('trackingIdSelect');
    const updateTrackingForm = document.getElementById('updateTrackingForm');
    const trackingHistoryList = document.getElementById('trackingHistoryList');
    const addHistoryForm = document.getElementById('addHistoryForm');
    const editHistoryModal = document.getElementById('editHistoryModal');
    const saveHistoryEditBtn = document.getElementById('saveHistoryEditBtn');
    const editHistoryModalTrackingMongoId = document.getElementById('editHistoryModalTrackingMongoId');
    const editHistoryModalHistoryId = document.getElementById('editHistoryModalHistoryId');
    const editHistoryDate = document.getElementById('editHistoryDate');
    const editHistoryTime = document.getElementById('editHistoryTime');
    const editHistoryLocation = document.getElementById('editHistoryLocation');
    const editHistoryDescription = document.getElementById('editHistoryDescription');
    const sendEmailForm = document.getElementById('sendEmailForm');
    const notificationEmail = document.getElementById('notificationEmail');
    const emailSubject = document.getElementById('emailSubject');
    const notificationMessage = document.getElementById('notificationMessage');
    const emailTrackingIdSelect = document.getElementById('emailTrackingIdSelect');
    const emailAttachmentFileUpload = document.getElementById('emailAttachmentFileUpload');
    const uploadPackageFileForm = document.getElementById('uploadPackageFileForm');
    const attachFileTrackingIdSelect = document.getElementById('attachFileTrackingIdSelect');
    const packageFileInput = document.getElementById('packageFileInput');
    const usersTableBody = document.getElementById('usersTableBody');
    const createUserForm = document.getElementById('createUserForm');
    const createUserModal = document.getElementById('createUserModal');
    const editUserForm = document.getElementById('editUserForm');
    const editUserModal = document.getElementById('editUserModal');
    const deleteUserModalTrigger = document.getElementById('deleteUserModalTrigger');
    const deleteUserBtn = document.getElementById('confirmDeleteUserBtn');
    const userIdToDeleteInput = document.getElementById('userIdToDeleteInput');
    const usernameToDelete = document.getElementById('usernameToDelete');
    const totalPackages = document.getElementById('totalPackages');
    const deliveredPackages = document.getElementById('deliveredPackages');
    const inTransitPackages = document.getElementById('inTransitPackages');
    const pendingPackages = document.getElementById('pendingPackages');
    const exceptionsPackages = document.getElementById('exceptionsPackages');
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const logoutBtn = document.getElementById('logoutBtn');

    // Navigation and Page State
    document.querySelectorAll('nav a, .sidebar-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetSectionId = this.getAttribute('data-target');
            if (targetSectionId) {
                e.preventDefault();
                showSection(targetSectionId);
            }
        });
    });

    function showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('active');
            // Fetch data for the active section
            if (sectionId === 'manage-tracking-section') {
                fetchAllTrackings();
                fetchTrackingIdsForSelect();
            } else if (sectionId === 'user-management-section') {
                fetchAllUsers();
            }
        }
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            window.location.href = 'admin_login.html';
        });
    }

    // --- Tracking Management Functions ---

    // Fetch All Trackings
    function fetchAllTrackings() {
        fetch('/api/admin/trackings', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        M.toast({
                            html: 'Session expired or unauthorized. Please log in again.',
                            classes: 'red darken-2'
                        });
                        setTimeout(() => window.location.href = 'admin_login.html', 2000);
                    }
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error fetching trackings');
                    });
                }
                return response.json();
            })
            .then(trackings => {
                if (trackingTableBody) {
                    trackingTableBody.innerHTML = '';
                    if (trackings.length === 0) {
                        trackingTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No tracking records found.</td></tr>';
                        return;
                    }
                    trackings.forEach(tracking => {
                        const statusClass = getStatusColorClass(tracking.status);
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${tracking.trackingId}</td>
                            <td>${tracking.senderName}</td>
                            <td>${tracking.recipientName}</td>
                            <td><span class="status-badge ${statusClass}">${tracking.status}</span></td>
                            <td>${tracking.expectedDeliveryDate ? new Date(tracking.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <button class="btn-small waves-effect waves-light blue darken-1 edit-btn" data-id="${tracking._id}"><i class="material-icons">edit</i></button>
                                <button class="btn-small waves-effect waves-light red darken-2 delete-btn" data-id="${tracking._id}"><i class="material-icons">delete</i></button>
                            </td>
                        `;
                        trackingTableBody.appendChild(row);
                    });

                    attachTrackingButtonListeners();
                    updateDashboardStats(trackings);
                }
            })
            .catch(error => {
                console.error('Error fetching trackings:', error);
                if (trackingTableBody) {
                    trackingTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: red;">Failed to load trackings: ${error.message}</td></tr>`;
                }
                M.toast({
                    html: `Failed to load trackings: ${error.message}`,
                    classes: 'red darken-2'
                });
            });
    }

    // Attach listeners for edit/delete buttons
    function attachTrackingButtonListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const trackingId = this.dataset.id;
                fetchTrackingDetails(trackingId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const trackingId = this.dataset.id;
                if (confirm('Are you sure you want to delete this tracking record?')) {
                    deleteTracking(trackingId);
                }
            });
        });
    }

    // Fetch Single Tracking Details
    function fetchTrackingDetails(trackingMongoId) {
        fetch(`/api/admin/trackings/mongo/${trackingMongoId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch tracking details');
                }
                return response.json();
            })
            .then(tracking => {
                document.getElementById('editTrackingMongoId').value = tracking._id;
                document.getElementById('editTrackingId').value = tracking.trackingId;
                document.getElementById('editSenderName').value = tracking.senderName;
                document.getElementById('editRecipientName').value = tracking.recipientName;
                document.getElementById('editOrigin').value = tracking.origin;
                document.getElementById('editDestination').value = tracking.destination;
                document.getElementById('editStatus').value = tracking.status;
                document.getElementById('editExpectedDeliveryDate').value = tracking.expectedDeliveryDate ? new Date(tracking.expectedDeliveryDate).toISOString().split('T')[0] : '';
                document.getElementById('editWeight').value = tracking.weight;
                document.getElementById('editDimensions').value = tracking.dimensions;
                document.getElementById('editRecipientEmail').value = tracking.recipientEmail;
                document.getElementById('editServiceType').value = tracking.serviceType;
                M.updateTextFields();
                M.FormSelect.init(document.querySelectorAll('#updateTrackingForm select'));
                M.Datepicker.init(document.getElementById('editExpectedDeliveryDate'));
                M.Modal.getInstance(document.getElementById('editTrackingModal')).open();
            })
            .catch(error => {
                console.error('Error fetching tracking details:', error);
                M.toast({
                    html: `Failed to load tracking details: ${error.message}`,
                    classes: 'red darken-2'
                });
            });
    }

    // Create Tracking
    if (trackingForm) {
        trackingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const newTracking = {
                trackingId: document.getElementById('newTrackingId').value,
                senderName: document.getElementById('newSenderName').value,
                recipientName: document.getElementById('newRecipientName').value,
                origin: document.getElementById('newOrigin').value,
                destination: document.getElementById('newDestination').value,
                status: document.getElementById('newStatus').value,
                expectedDeliveryDate: document.getElementById('newExpectedDeliveryDate').value,
                weight: document.getElementById('newWeight').value,
                dimensions: document.getElementById('newDimensions').value,
                recipientEmail: document.getElementById('newRecipientEmail').value,
                serviceType: document.getElementById('newServiceType').value,
                history: []
            };

            fetch('/api/admin/trackings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(newTracking)
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Server error creating tracking');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        M.toast({
                            html: 'Tracking record created successfully!',
                            classes: 'green darken-2'
                        });
                        trackingForm.reset();
                        M.updateTextFields();
                        fetchAllTrackings();
                        fetchTrackingIdsForSelect();
                        fetchTrackingIdsForEmailSelect();
                        fetchTrackingIdsForAttachFileSelect();
                    } else {
                        M.toast({
                            html: `Error: ${data.message || 'Could not create tracking record.'}`,
                            classes: 'red darken-2'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error creating tracking:', error);
                    M.toast({
                        html: `Network error or server issue: ${error.message}`,
                        classes: 'red darken-2'
                    });
                });
        });
    }

    // Update Tracking
    if (updateTrackingForm) {
        updateTrackingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const trackingMongoId = document.getElementById('editTrackingMongoId').value;
            const updatedTracking = {
                trackingId: document.getElementById('editTrackingId').value,
                senderName: document.getElementById('editSenderName').value,
                recipientName: document.getElementById('editRecipientName').value,
                origin: document.getElementById('editOrigin').value,
                destination: document.getElementById('editDestination').value,
                status: document.getElementById('editStatus').value,
                expectedDeliveryDate: document.getElementById('editExpectedDeliveryDate').value,
                weight: document.getElementById('editWeight').value,
                dimensions: document.getElementById('editDimensions').value,
                recipientEmail: document.getElementById('editRecipientEmail').value,
                serviceType: document.getElementById('editServiceType').value,
            };

            fetch(`/api/admin/trackings/${trackingMongoId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(updatedTracking)
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Server error updating tracking');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        M.toast({
                            html: 'Tracking record updated successfully!',
                            classes: 'green darken-2'
                        });
                        M.Modal.getInstance(document.getElementById('editTrackingModal')).close();
                        fetchAllTrackings();
                    } else {
                        M.toast({
                            html: `Error: ${data.message || 'Could not update tracking record.'}`,
                            classes: 'red darken-2'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error updating tracking:', error);
                    M.toast({
                        html: `Network error or server issue: ${error.message}`,
                        classes: 'red darken-2'
                    });
                });
        });
    }

    // Delete Tracking
    function deleteTracking(trackingId) {
        fetch(`/api/admin/trackings/${trackingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error deleting tracking');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    M.toast({
                        html: 'Tracking record deleted successfully!',
                        classes: 'red darken-2'
                    });
                    fetchAllTrackings();
                    fetchTrackingIdsForSelect();
                    fetchTrackingIdsForEmailSelect();
                    fetchTrackingIdsForAttachFileSelect();
                } else {
                    M.toast({
                        html: `Error: ${data.message || 'Could not delete tracking record.'}`,
                        classes: 'red darken-2'
                    });
                }
            })
            .catch(error => {
                console.error('Error deleting tracking:', error);
                M.toast({
                    html: `Network error or server issue: ${error.message}`,
                    classes: 'red darken-2'
                });
            });
    }

    // Populate Tracking ID dropdowns
    function fetchTrackingIdsForSelect() {
        fetch('/api/admin/trackings', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => response.json())
            .then(trackings => {
                if (trackingIdSelect) {
                    trackingIdSelect.innerHTML = '<option value="" disabled selected>Choose a Tracking ID</option>';
                    trackings.forEach(tracking => {
                        const option = document.createElement('option');
                        option.value = tracking.trackingId;
                        option.textContent = tracking.trackingId;
                        trackingIdSelect.appendChild(option);
                    });
                    M.FormSelect.init(trackingIdSelect);
                }
            })
            .catch(error => console.error('Error fetching tracking IDs:', error));
    }

    function fetchTrackingIdsForEmailSelect() {
        fetch('/api/admin/trackings', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => response.json())
            .then(trackings => {
                if (emailTrackingIdSelect) {
                    emailTrackingIdSelect.innerHTML = '<option value="" disabled selected>Choose a Tracking ID</option>';
                    trackings.forEach(tracking => {
                        const option = document.createElement('option');
                        option.value = tracking.trackingId;
                        option.textContent = tracking.trackingId;
                        emailTrackingIdSelect.appendChild(option);
                    });
                    M.FormSelect.init(emailTrackingIdSelect);
                }
            })
            .catch(error => console.error('Error fetching tracking IDs for email:', error));
    }

    function fetchTrackingIdsForAttachFileSelect() {
        fetch('/api/admin/trackings', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => response.json())
            .then(trackings => {
                if (attachFileTrackingIdSelect) {
                    attachFileTrackingIdSelect.innerHTML = '<option value="" disabled selected>Choose a Tracking ID</option>';
                    trackings.forEach(tracking => {
                        const option = document.createElement('option');
                        option.value = tracking.trackingId;
                        option.textContent = tracking.trackingId;
                        attachFileTrackingIdSelect.appendChild(option);
                    });
                    M.FormSelect.init(attachFileTrackingIdSelect);
                }
            })
            .catch(error => console.error('Error fetching tracking IDs for file attach:', error));
    }

    // --- Manage Single Tracking Section ---
    // NEW FUNCTION TO FETCH AND DISPLAY ALL TRACKING DETAILS
    function fetchAndDisplayTrackingDetails(trackingId) {
        if (!trackingId) {
            // Clear all fields if no ID is selected
            document.getElementById('detailsSenderName').textContent = '';
            document.getElementById('detailsRecipientName').textContent = '';
            document.getElementById('detailsStatus').textContent = '';
            document.getElementById('detailsExpectedDeliveryDate').textContent = '';
            document.getElementById('detailsOrigin').textContent = '';
            document.getElementById('detailsDestination').textContent = '';
            document.getElementById('historyTrackingIdInput').value = '';
            trackingHistoryList.querySelector('ul').innerHTML = '<li class="collection-item">Select a tracking ID to view details and history.</li>';
            return;
        }

        fetch(`/api/admin/trackings/${trackingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Server error fetching tracking details');
                });
            }
            return response.json();
        })
        .then(trackingData => {
            // Populate the main tracking details
            document.getElementById('detailsTrackingId').textContent = trackingData.trackingId;
            document.getElementById('detailsSenderName').textContent = trackingData.senderName;
            document.getElementById('detailsRecipientName').textContent = trackingData.recipientName;
            document.getElementById('detailsStatus').textContent = trackingData.status;
            document.getElementById('detailsExpectedDeliveryDate').textContent = trackingData.expectedDeliveryDate ? new Date(trackingData.expectedDeliveryDate).toLocaleDateString() : 'N/A';
            document.getElementById('detailsOrigin').textContent = trackingData.origin;
            document.getElementById('detailsDestination').textContent = trackingData.destination;

            // Set the mongoId for the history form
            document.getElementById('historyTrackingIdInput').value = trackingData._id;

            // Call the existing function to populate the history
            fetchTrackingHistory(trackingData.trackingId);
        })
        .catch(error => {
            console.error('Error fetching tracking details:', error);
            M.toast({ html: `Failed to load tracking details: ${error.message}`, classes: 'red darken-2' });
        });
    }

    // Event listener for the trackingIdSelect dropdown
    if (trackingIdSelect) {
        trackingIdSelect.addEventListener('change', function() {
            const selectedTrackingId = this.value;
            fetchAndDisplayTrackingDetails(selectedTrackingId);
        });
    }

    // Fetch tracking history
    function fetchTrackingHistory(trackingId) {
        console.log(`Attempting to fetch history for tracking ID: ${trackingId}`);
        fetch(`/api/admin/trackings/${trackingId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        M.toast({
                            html: 'Session expired or unauthorized. Please log in again.',
                            classes: 'red darken-2'
                        });
                        setTimeout(() => window.location.href = 'admin_login.html', 2000);
                    }
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error fetching tracking details');
                    });
                }
                return response.json();
            })
            .then(trackingData => {
                const historyEvents = trackingData.history;
                const ul = trackingHistoryList.querySelector('ul');
                ul.innerHTML = '';

                if (!historyEvents || historyEvents.length === 0) {
                    ul.innerHTML = '<li class="collection-item">No history events yet.</li>';
                    return;
                }

                historyEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                historyEvents.forEach(event => {
                    const li = document.createElement('li');
                    li.classList.add('collection-item');
                    li.innerHTML = `
                        <div class="history-content">
                            <strong>${new Date(event.timestamp).toLocaleString()}</strong> - ${event.location ? `${event.location}: ` : ''}${event.description}
                        </div>
                        <div class="history-actions">
                            <button class="btn-small waves-effect waves-light blue edit-history-btn"
                                data-tracking-mongo-id="${trackingData._id}" data-history-id="${event._id}"
                                data-date="${new Date(event.timestamp).toISOString().split('T')[0]}"
                                data-time="${new Date(event.timestamp).toTimeString().split(' ')[0].substring(0, 5)}"
                                data-location="${event.location || ''}"
                                data-description="${event.description}">
                                <i class="material-icons">edit</i>
                            </button>
                            <button class="btn-small waves-effect waves-light red delete-history-btn"
                                data-tracking-mongo-id="${trackingData._id}" data-history-id="${event._id}">
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    `;
                    ul.appendChild(li);
                });

                attachHistoryButtonListeners();
            })
            .catch(error => {
                console.error('Error fetching tracking history:', error);
                const ul = trackingHistoryList.querySelector('ul');
                ul.innerHTML = `<li class="collection-item red-text">Failed to load history: ${error.message}</li>`;
                M.toast({
                    html: `Failed to load tracking history: ${error.message}`,
                    classes: 'red darken-2'
                });
            });
    }

    function attachHistoryButtonListeners() {
        document.querySelectorAll('.edit-history-btn').forEach(button => {
            button.addEventListener('click', function() {
                const trackingMongoId = this.dataset.trackingMongoId;
                const historyId = this.dataset.historyId;
                const date = this.dataset.date;
                const time = this.dataset.time;
                const location = this.dataset.location;
                const description = this.dataset.description;

                editHistoryModalTrackingMongoId.value = trackingMongoId;
                editHistoryModalHistoryId.value = historyId;
                editHistoryDate.value = date;
                editHistoryTime.value = time;
                editHistoryLocation.value = location;
                editHistoryDescription.value = description;

                M.updateTextFields();
                M.Datepicker.init(editHistoryDate);
                M.Timepicker.init(editHistoryTime);

                M.Modal.getInstance(editHistoryModal).open();
            });
        });

        document.querySelectorAll('.delete-history-btn').forEach(button => {
            button.addEventListener('click', function() {
                const trackingMongoId = this.dataset.trackingMongoId;
                const historyId = this.dataset.historyId;
                if (confirm('Are you sure you want to delete this history event?')) {
                    deleteHistoryEvent(trackingMongoId, historyId);
                }
            });
        });
    }

    if (addHistoryForm) {
        addHistoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const trackingMongoId = document.getElementById('historyTrackingIdInput').value;

            const newHistoryEvent = {
                date: document.getElementById('newHistoryDate').value,
                time: document.getElementById('newHistoryTime').value,
                location: document.getElementById('newHistoryLocation').value,
                description: document.getElementById('newHistoryDescription').value
            };

            fetch(`/api/admin/trackings/${trackingMongoId}/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(newHistoryEvent)
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            M.toast({
                                html: 'Session expired or unauthorized. Please log in again.',
                                classes: 'red darken-2'
                            });
                            setTimeout(() => window.location.href = 'admin_login.html', 2000);
                        }
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Server error adding history event');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        M.toast({
                            html: 'History event added successfully!',
                            classes: 'green darken-2'
                        });
                        addHistoryForm.reset();
                        M.updateTextFields();
                        M.Datepicker.init(document.getElementById('newHistoryDate'));
                        M.Timepicker.init(document.getElementById('newHistoryTime'));
                        fetchTrackingHistory(trackingMongoId);
                    } else {
                        M.toast({
                            html: `Error: ${data.message || 'Could not add history event.'}`,
                            classes: 'red darken-2'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error adding history event:', error);
                    M.toast({
                        html: `Network error or server issue: ${error.message}`,
                        classes: 'red darken-2'
                    });
                });
        });
    }

    if (saveHistoryEditBtn) {
        saveHistoryEditBtn.addEventListener('click', function() {
            const trackingMongoId = editHistoryModalTrackingMongoId.value;
            const historyId = editHistoryModalHistoryId.value;

            const datepickerInstance = M.Datepicker.getInstance(editHistoryDate);
            const timepickerInstance = M.Timepicker.getInstance(editHistoryTime);

            let isoTimestamp = '';
            if (datepickerInstance && datepickerInstance.date && timepickerInstance && timepickerInstance.time) {
                const date = datepickerInstance.date;
                const [time, period] = timepickerInstance.time.split(' ');
                let [hours, minutes] = time.split(':').map(Number);

                if (period === 'PM' && hours < 12) {
                    hours += 12;
                }
                if (period === 'AM' && hours === 12) {
                    hours = 0;
                }

                date.setHours(hours, minutes, 0, 0);
                isoTimestamp = date.toISOString();
            } else {
                M.toast({
                    html: 'Please select a valid date and time.',
                    classes: 'red darken-2'
                });
                return;
            }

            const updatedHistoryEvent = {
                timestamp: isoTimestamp,
                location: editHistoryLocation.value,
                description: editHistoryDescription.value
            };

            fetch(`/api/admin/trackings/${trackingMongoId}/history/${historyId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(updatedHistoryEvent)
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            M.toast({
                                html: 'Session expired or unauthorized. Please log in again.',
                                classes: 'red darken-2'
                            });
                            setTimeout(() => window.location.href = 'admin_login.html', 2000);
                        }
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Server error updating history event');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        M.toast({
                            html: 'History event updated successfully!',
                            classes: 'green darken-2'
                        });
                        M.Modal.getInstance(editHistoryModal).close();
                        fetchTrackingHistory(trackingMongoId);
                    } else {
                        M.toast({
                            html: `Error: ${data.message || 'Could not update history event.'}`,
                            classes: 'red darken-2'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error updating history event:', error);
                    M.toast({
                        html: `Network error or server issue: ${error.message}`,
                        classes: 'red darken-2'
                    });
                });
        });
    }

    function deleteHistoryEvent(trackingMongoId, historyId) {
        fetch(`/api/admin/trackings/${trackingMongoId}/history/${historyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        M.toast({
                            html: 'Session expired or unauthorized. Please log in again.',
                            classes: 'red darken-2'
                        });
                        setTimeout(() => window.location.href = 'admin_login.html', 2000);
                    }
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error deleting history event');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    M.toast({
                        html: 'History event deleted successfully!',
                        classes: 'red darken-2'
                    });
                    fetchTrackingHistory(trackingMongoId);
                } else {
                    M.toast({
                        html: `Error: ${data.message || 'Could not delete history event.'}`,
                        classes: 'red darken-2'
                    });
                }
            })
            .catch(error => {
                console.error('Error deleting history event:', error);
                M.toast({
                    html: `Network error or server issue: ${error.message}`,
                    classes: 'red darken-2'
                });
            });
    }


    // --- Send Email Notification ---
    if (sendEmailForm) {
        sendEmailForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const recipient = notificationEmail.value.trim();
            const subject = emailSubject.value.trim();
            const message = notificationMessage.value.trim();
            const trackingId = emailTrackingIdSelect.value;

            if (!recipient || !subject || !message) {
                M.toast({
                    html: 'Recipient, Subject, and Message fields are required.',
                    classes: 'red darken-2'
                });
                return;
            }

            if (!trackingId) {
                M.toast({
                    html: 'Please select a Tracking ID.',
                    classes: 'red darken-2'
                });
                return;
            }

            const formData = new FormData();
            formData.append('recipientEmail', recipient);
            formData.append('subject', subject);
            formData.append('message', message);
            formData.append('trackingId', trackingId);

            const attachment = emailAttachmentFileUpload.files[0];
            if (attachment) {
                formData.append('attachment', attachment);
            }

            fetch('/api/admin/send-email', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            M.toast({
                                html: 'Session expired or unauthorized. Please log in again.',
                                classes: 'red darken-2'
                            });
                            setTimeout(() => window.location.href = 'admin_login.html', 2000);
                        }
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Server error sending email');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        M.toast({
                            html: 'Email sent successfully!',
                            classes: 'green darken-2'
                        });
                        sendEmailForm.reset();
                        M.updateTextFields();
                        M.FormSelect.init(emailTrackingIdSelect);
                    } else {
                        M.toast({
                            html: `Error: ${data.message || 'Could not send email.'}`,
                            classes: 'red darken-2'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error sending email:', error);
                    M.toast({
                        html: `Network error or server issue: ${error.message}`,
                        classes: 'red darken-2'
                    });
                });
        });
    }

    // --- Pre-fill email on tracking ID selection ---
    if (emailTrackingIdSelect) {
        emailTrackingIdSelect.addEventListener('change', function() {
            const trackingId = this.value;
            if (trackingId) {
                fetch(`/api/admin/trackings/${trackingId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    })
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to fetch tracking details for email pre-fill');
                        return response.json();
                    })
                    .then(tracking => {
                        if (notificationEmail) notificationEmail.value = tracking.recipientEmail || '';
                        if (emailSubject) emailSubject.value = `Update on your FedEx Shipment: ${tracking.trackingId}`;
                        if (notificationMessage) notificationMessage.value = `Dear ${tracking.recipientName},\n\nYour shipment with tracking ID ${tracking.trackingId} is currently "${tracking.status}".\n\nLatest update: ${tracking.status} at ${new Date().toLocaleString()}.\n\nExpected delivery: ${new Date(tracking.expectedDeliveryDate).toLocaleDateString()}.\n\nThank you for choosing FedEx.`;
                        M.updateTextFields();
                    })
                    .catch(error => {
                        console.error('Error pre-filling email:', error);
                        M.toast({
                            html: `Could not pre-fill email: ${error.message}`,
                            classes: 'red darken-2'
                        });
                    });
            } else {
                if (notificationEmail) notificationEmail.value = '';
                if (emailSubject) emailSubject.value = '';
                if (notificationMessage) notificationMessage.value = '';
                M.updateTextFields();
            }
        });
    }

    // --- Upload Package File ---
    if (uploadPackageFileForm) {
        uploadPackageFileForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const trackingId = attachFileTrackingIdSelect.value;
            const file = packageFileInput.files[0];

            if (!trackingId) {
                M.toast({
                    html: 'Please select a Tracking ID to link the file to.',
                    classes: 'red darken-2'
                });
                return;
            }
            if (!file) {
                M.toast({
                    html: 'Please select a file to upload.',
                    classes: 'red darken-2'
                });
                return;
            }

            const formData = new FormData();
            formData.append('packageFile', file);

            fetch(`/api/admin/trackings/${trackingId}/upload-file`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            M.toast({
                                html: 'Session expired or unauthorized. Please log in again.',
                                classes: 'red darken-2'
                            });
                            setTimeout(() => window.location.href = 'admin_login.html', 2000);
                        }
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Server error uploading file');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        M.toast({
                            html: 'File uploaded and linked successfully!',
                            classes: 'green darken-2'
                        });
                        uploadPackageFileForm.reset();
                        M.updateTextFields();
                        M.FormSelect.init(attachFileTrackingIdSelect);
                    } else {
                        M.toast({
                            html: `Error: ${data.message || 'Could not upload file.'}`,
                            classes: 'red darken-2'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error uploading file:', error);
                    M.toast({
                        html: `Network error or server issue: ${error.message}`,
                        classes: 'red darken-2'
                    });
                });
        });
    }

    // --- User Management Functions ---

    // Fetch All Users
    function fetchAllUsers() {
        fetch('/api/admin/users', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        M.toast({
                            html: 'Session expired or unauthorized. Please log in again.',
                            classes: 'red darken-2'
                        });
                        setTimeout(() => window.location.href = 'admin_login.html', 2000);
                    }
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error fetching users');
                    });
                }
                return response.json();
            })
            .then(users => {
                if (usersTableBody) {
                    usersTableBody.innerHTML = '';
                    if (users.length === 0) {
                        usersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No users found.</td></tr>';
                        return;
                    }
                    users.forEach(user => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>
                                <button class="btn btn-small waves-effect waves-light blue darken-1 edit-user-btn" data-user-id="${user._id}"><i class="material-icons">edit</i></button>
                                <button class="btn btn-small waves-effect waves-light red darken-2 delete-user-modal-trigger" data-user-id="${user._id}" data-username="${user.username}"><i class="material-icons">delete</i></button>
                            </td>
                        `;
                        usersTableBody.appendChild(row);
                    });

                    document.querySelectorAll('.edit-user-btn').forEach(button => {
                        button.addEventListener('click', function() {
                            const userId = this.dataset.userId;
                            fetchUserDetails(userId);
                        });
                    });

                    document.querySelectorAll('.delete-user-modal-trigger').forEach(button => {
                        button.addEventListener('click', function() {
                            const userId = this.dataset.userId;
                            const userNm = this.dataset.username;
                            userIdToDeleteInput.value = userId;
                            if (usernameToDelete) usernameToDelete.textContent = userNm;
                            M.Modal.getInstance(deleteUserModalTrigger).open();
                        });
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                if (usersTableBody) {
                    usersTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: red;">Failed to load users: ${error.message}</td></tr>`;
                }
                M.toast({
                    html: `Failed to load users: ${error.message}`,
                    classes: 'red darken-2'
                });
            });
    }

    // Create User
    if (createUserForm) {
        createUserForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const userData = {
                username: document.getElementById('newUsername').value,
                email: document.getElementById('newEmail').value,
                password: document.getElementById('newPassword').value,
                role: document.getElementById('newUserRole').value
            };

            fetch('/api/admin/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(userData)
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            M.toast({
                                html: 'Session expired or unauthorized. Please log in again.',
                                classes: 'red darken-2'
                            });
                            setTimeout(() => window.location.href = 'admin_login.html', 2000);
                        }
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Server error creating user');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        M.toast({
                            html: 'User created successfully!',
                            classes: 'green darken-2'
                        });
                        M.Modal.getInstance(createUserModal).close();
                        createUserForm.reset();
                        M.updateTextFields();
                        M.FormSelect.init(document.querySelectorAll('#createUserModal select'));
                        fetchAllUsers();
                    } else {
                        M.toast({
                            html: `Error: ${data.message || 'Could not create user.'}`,
                            classes: 'red darken-2'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error creating user:', error);
                    M.toast({
                        html: `Network error or server issue: ${error.message}`,
                        classes: 'red darken-2'
                    });
                });
        });
    }

    // Fetch User Details for Edit
    function fetchUserDetails(userId) {
        fetch(`/api/admin/users/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        M.toast({
                            html: 'Session expired or unauthorized. Please log in again.',
                            classes: 'red darken-2'
                        });
                        setTimeout(() => window.location.href = 'admin_login.html', 2000);
                    }
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error fetching user details');
                    });
                }
                return response.json();
            })
            .then(user => {
                document.getElementById('editUserId').value = user._id;
                document.getElementById('editUsername').value = user.username;
                document.getElementById('editEmail').value = user.email;
                document.getElementById('editUserRole').value = user.role;
                M.updateTextFields();
                M.FormSelect.init(document.querySelectorAll('#editUserModal select'));
                M.Modal.getInstance(editUserModal).open();
            })
            .catch(error => {
                console.error('Error fetching user details:', error);
                M.toast({
                    html: `Failed to load user details: ${error.message}`,
                    classes: 'red darken-2'
                });
            });
    }

    // Update User
    if (editUserForm) {
        editUserForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const userId = document.getElementById('editUserId').value;
            const updatedUserData = {
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                role: document.getElementById('editUserRole').value
            };

            const newPassword = document.getElementById('editPassword').value;
            if (newPassword) {
                updatedUserData.password = newPassword;
            }

            fetch(`/api/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(updatedUserData)
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            M.toast({
                                html: 'Session expired or unauthorized. Please log in again.',
                                classes: 'red darken-2'
                            });
                            setTimeout(() => window.location.href = 'admin_login.html', 2000);
                        }
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Server error updating user');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        M.toast({
                            html: 'User updated successfully!',
                            classes: 'green darken-2'
                        });
                        M.Modal.getInstance(editUserModal).close();
                        editUserForm.reset();
                        M.updateTextFields();
                        fetchAllUsers();
                    } else {
                        M.toast({
                            html: `Error: ${data.message || 'Could not update user.'}`,
                            classes: 'red darken-2'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error updating user:', error);
                    M.toast({
                        html: `Network error or server issue: ${error.message}`,
                        classes: 'red darken-2'
                    });
                });
        });
    }

    // Delete User
    if (deleteUserBtn) {
        deleteUserBtn.addEventListener('click', function() {
            const userId = userIdToDeleteInput.value.trim();

            if (!userId || userId.length === 0) {
                M.toast({
                    html: 'Error: User ID is missing or invalid. Cannot delete.',
                    classes: 'red darken-2'
                });
                console.error('Client-side validation failed: User ID is', userId);
                M.Modal.getInstance(deleteUserModalTrigger).close();
                return;
            }

            fetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            M.toast({
                                html: 'Session expired or unauthorized. Please log in again.',
                                classes: 'red darken-2'
                            });
                            setTimeout(() => window.location.href = 'admin_login.html', 2000);
                        }
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Server error deleting user');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        M.toast({
                            html: 'User deleted successfully!',
                            classes: 'green darken-2'
                        });
                        M.Modal.getInstance(deleteUserModalTrigger).close();
                        fetchAllUsers();
                    } else {
                        M.toast({
                            html: `Error: ${data.message || 'Could not delete user.'}`,
                            classes: 'red darken-2'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error deleting user:', error);
                    M.toast({
                        html: `Network error or server issue: ${error.message}`,
                        classes: 'red darken-2'
                    });
                });
        });
    }

    // --- Dashboard Quick Stats Update ---
    function updateDashboardStats(trackings) {
        const total = trackings.length;
        const delivered = trackings.filter(t => t.status.toLowerCase().includes('delivered')).length;
        const inTransit = trackings.filter(t => t.status.toLowerCase().includes('in transit')).length;
        const pending = trackings.filter(t => t.status.toLowerCase().includes('pending') || t.status.toLowerCase().includes('on hold')).length;
        const exceptions = trackings.filter(t => t.status.toLowerCase().includes('exception') || t.status.toLowerCase().includes('delay')).length;

        if (totalPackages) totalPackages.textContent = total;
        if (deliveredPackages) deliveredPackages.textContent = delivered;
        if (inTransitPackages) inTransitPackages.textContent = inTransit;
        if (pendingPackages) pendingPackages.textContent = pending;
        if (exceptionsPackages) exceptionsPackages.textContent = exceptions;
    }

    function getStatusColorClass(status) {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('delivered')) {
            return 'delivered';
        } else if (lowerStatus.includes('in transit')) {
            return 'in-transit';
        } else if (lowerStatus.includes('pending') || lowerStatus.includes('on hold')) {
            return 'pending';
        } else if (lowerStatus.includes('exception') || lowerStatus.includes('delay')) {
            return 'exception';
        } else {
            return 'unknown';
        }
    }

    // Initial load: show dashboard and fetch all trackings to populate stats
    showSection('dashboard-section');
    fetchAllTrackings();
    fetchTrackingIdsForSelect();
    fetchTrackingIdsForEmailSelect();
    fetchTrackingIdsForAttachFileSelect();

    // --- Sidebar Toggle Logic ---
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    } else {
        console.error("Sidebar or menu toggle button not found in the DOM.");
    }

    // Initialize Modals
    M.Modal.init(document.querySelectorAll('.modal'));
    M.FormSelect.init(document.querySelectorAll('select'));
    M.Datepicker.init(document.querySelectorAll('.datepicker'));
    M.Timepicker.init(document.querySelectorAll('.timepicker'));
});