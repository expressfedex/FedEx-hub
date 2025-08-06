// admin_dashboard.js

// This event listener ensures that the script runs only after the entire HTML document is loaded.
document.addEventListener('DOMContentLoaded', function() {

    // --- Global Variable Declarations & Initializations ---
    // Get references to all necessary DOM elements.
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const notificationEmailInput = document.getElementById('notificationEmail');
    const emailSubjectInput = document.getElementById('emailSubject');
    const notificationMessageInput = document.getElementById('notificationMessage');
    const emailTrackingIdSelect = document.getElementById('emailTrackingIdSelect');
    const emailAttachmentFileUpload = document.getElementById('emailAttachmentFileUpload');

    const attachFileTrackingIdSelect = document.getElementById('attachFileTrackingIdSelect');
    const packageFileInput = document.getElementById('packageFileInput');
    const uploadPackageFileForm = document.getElementById('uploadPackageFileForm');

    const usersTableBody = document.getElementById('users-table-body');
    const createUserModal = document.getElementById('createUserModal');
    const createUserForm = document.getElementById('createUserForm');
    const editUserModal = document.getElementById('editUserModal');
    const editUserForm = document.getElementById('editUserForm');
    const deleteUserModalTrigger = document.getElementById('deleteUserModal');
    const deleteUserBtn = document.getElementById('deleteUserBtn');
    const userIdToDeleteInput = document.getElementById('userIdToDelete');

    // Initialize all Materialize components
    M.AutoInit();
    M.updateTextFields(); // Required for Materialize text inputs to work correctly after dynamic content changes.
    M.FormSelect.init(document.querySelectorAll('select')); // Initialize all select dropdowns.

    // --- Helper Functions ---

    /**
     * Displays a toast notification using Materialize CSS.
     * @param {string} message - The message to display.
     * @param {string} classes - CSS classes for styling the toast (e.g., 'red darken-2').
     */
    function showToast(message, classes = 'blue') {
        M.toast({ html: message, classes: classes });
    }

    /**
     * Handles unauthorized access by showing a toast and redirecting to the login page.
     */
    function handleUnauthorizedAccess() {
        showToast('Session expired or unauthorized. Please log in again.', 'red darken-2');
        setTimeout(() => window.location.href = 'admin_login.html', 2000);
    }

    /**
     * Hides all main content sections and shows the one with the specified ID.
     * @param {string} sectionId - The ID of the section to show.
     */
    function showSection(sectionId) {
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.style.display = 'block';
        }
    }

    /**
     * Fetches all tracking data from the server.
     */
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
                    handleUnauthorizedAccess();
                    return;
                }
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Server error fetching tracking data');
                });
            }
            return response.json();
        })
        .then(trackings => {
            updateDashboardStats(trackings);
            // You would also call a function to render the tracking list here, e.g., renderTrackingList(trackings);
        })
        .catch(error => {
            console.error('Error fetching tracking data:', error);
            showToast(`Failed to load tracking data: ${error.message}`, 'red darken-2');
        });
    }

    /**
     * Updates the dashboard quick stats based on the provided tracking data.
     * @param {Array} trackings - An array of tracking objects.
     */
    function updateDashboardStats(trackings) {
        const total = trackings.length;
        const delivered = trackings.filter(t => t.status.toLowerCase().includes('delivered')).length;
        const inTransit = trackings.filter(t => t.status.toLowerCase().includes('in transit')).length;
        const pending = trackings.filter(t => t.status.toLowerCase().includes('pending') || t.status.toLowerCase().includes('on hold')).length;
        const exceptions = trackings.filter(t => t.status.toLowerCase().includes('exception') || t.status.toLowerCase().includes('delay')).length;

        document.getElementById('totalPackages').textContent = total;
        document.getElementById('deliveredPackages').textContent = delivered;
        document.getElementById('inTransitPackages').textContent = inTransit;
        document.getElementById('pendingPackages').textContent = pending;
        document.getElementById('exceptionsPackages').textContent = exceptions;
    }

    /**
     * Fetches and populates the tracking IDs for the email form select dropdown.
     */
    function fetchTrackingIdsForEmailSelect() {
        fetch('/api/admin/trackings', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    handleUnauthorizedAccess();
                    return;
                }
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Server error fetching tracking IDs');
                });
            }
            return response.json();
        })
        .then(trackings => {
            emailTrackingIdSelect.innerHTML = '<option value="" disabled selected>Select Tracking ID (Optional, for pre-filling email)</option>';
            trackings.forEach(tracking => {
                const option = document.createElement('option');
                option.value = tracking.trackingId;
                option.textContent = tracking.trackingId;
                emailTrackingIdSelect.appendChild(option);
            });
            M.FormSelect.init(emailTrackingIdSelect);
        })
        .catch(error => {
            console.error('Error fetching tracking IDs for email form:', error);
            showToast(`Error fetching tracking IDs: ${error.message}`, 'red darken-2');
        });
    }

    /**
     * Fetches and populates the tracking IDs for the file attachment form select dropdown.
     */
    function fetchTrackingIdsForAttachFileSelect() {
        fetch('/api/admin/trackings', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    handleUnauthorizedAccess();
                    return;
                }
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Server error fetching tracking IDs for file attachment');
                });
            }
            return response.json();
        })
        .then(trackings => {
            attachFileTrackingIdSelect.innerHTML = '<option value="" disabled selected>Select Tracking ID</option>';
            trackings.forEach(tracking => {
                const option = document.createElement('option');
                option.value = tracking._id;
                option.textContent = tracking.trackingId;
                attachFileTrackingIdSelect.appendChild(option);
            });
            M.FormSelect.init(attachFileTrackingIdSelect);
        })
        .catch(error => {
            console.error('Error fetching tracking IDs for file attachment:', error);
            showToast(`Error fetching file attachment IDs: ${error.message}`, 'red darken-2');
        });
    }

    /**
     * Renders the user data in the users table.
     * @param {Array} users - An array of user objects.
     */
    function renderUsersTable(users) {
        if (!usersTableBody) return; // Prevent error if the element doesn't exist
        usersTableBody.innerHTML = '';
        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No user data available.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${new Date(user.createdAt).toLocaleString()}</td>
                <td>
                    <button class="btn-small waves-effect waves-light green darken-2 edit-user-btn" data-id="${user._id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-small waves-effect waves-light red darken-2 delete-user-btn" data-id="${user._id}">
                        <i class="fas fa-user-times"></i> Delete
                    </button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });

        document.querySelectorAll('.edit-user-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.dataset.id;
                fetchUserDetails(userId);
            });
        });

        document.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.dataset.id;
                userIdToDeleteInput.value = userId;
                const deleteModalInstance = M.Modal.getInstance(deleteUserModalTrigger);
                if (deleteModalInstance) {
                    deleteModalInstance.open();
                }
            });
        });
    }

    /**
     * Fetches all users from the server and renders the user table.
     */
    function fetchAllUsers() {
        if (!usersTableBody) return; // Prevent error if the element doesn't exist
        usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;"><div class="preloader-wrapper active"><div class="spinner-layer spinner-blue-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div></div><p>Loading user data...</p></td></tr>';

        fetch('/api/admin/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    handleUnauthorizedAccess();
                    return;
                }
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Server error fetching users');
                });
            }
            return response.json();
        })
        .then(users => {
            renderUsersTable(users);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            usersTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: red;">Failed to load user data: ${error.message}.</td></tr>`;
            showToast(`Failed to load users: ${error.message}`, 'red darken-2');
        });
    }

    /**
     * Fetches a single user's details for editing.
     * @param {string} userId - The ID of the user to fetch.
     */
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
                    handleUnauthorizedAccess();
                    return;
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
            showToast(`Failed to load user details: ${error.message}`, 'red darken-2');
        });
    }

    // --- Main Event Listeners & Logic ---

    // Sidebar Toggle Logic
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Initial load: show dashboard and fetch all trackings and users
    showSection('dashboard-section');
    fetchAllTrackings();
    fetchAllUsers();
    fetchTrackingIdsForEmailSelect();
    fetchTrackingIdsForAttachFileSelect();

    // 1. Send Email Form Submission
    if (document.getElementById('sendEmailForm')) {
        document.getElementById('sendEmailForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const recipientEmail = notificationEmailInput.value;
            const emailSubject = emailSubjectInput.value;
            const userMessage = notificationMessageInput.value;
            const selectedTrackingId = emailTrackingIdSelect.options[emailTrackingIdSelect.selectedIndex].textContent;

            if (!recipientEmail || !emailSubject || !userMessage) {
                showToast('Please fill in all required email fields (Recipient, Subject, Message).', 'red darken-2');
                return;
            }

            const emailHtmlBody = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${emailSubject}</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                            color: #333;
                        }
                        .email-container {
                            max-width: 600px;
                            margin: 20px auto;
                            background-color: #ffffff;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #8A2BE2, #FF4500);
                            color: #ffffff;
                            padding: 20px;
                            text-align: center;
                            font-size: 24px;
                            font-weight: bold;
                            text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
                        }
                        .content {
                            padding: 30px;
                            line-height: 1.6;
                        }
                        .content p {
                            margin-bottom: 15px;
                        }
                        .highlight {
                            color: #8A2BE2;
                            font-weight: bold;
                        }
                        .tracking-info {
                            background-color: #f9f9f9;
                            border-left: 5px solid #FF4500;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 5px;
                        }
                        .tracking-info strong {
                            color: #FF4500;
                        }
                        .footer {
                            background-color: #333;
                            color: #ffffff;
                            text-align: center;
                            padding: 20px;
                            font-size: 12px;
                        }
                        .footer a {
                            color: #ffffff;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            Tracking Update Notification
                        </div>
                        <div class="content">
                            <p>Dear Customer,</p>
                            <p>We have an important update regarding your recent shipment.</p>
                            <p>${userMessage.replace(/\n/g, '<br>')}</p>
                            ${selectedTrackingId && selectedTrackingId !== "Select Tracking ID (Optional, for pre-filling email)" ?
                                `<div class="tracking-info">
                                    <strong>Tracking ID:</strong> <span class="highlight">${selectedTrackingId}</span>
                                    <p>You can track your package anytime by visiting our website and entering this ID.</p>
                                </div>`
                                : ''}
                            <p>Thank you for choosing our service.</p>
                            <p>Sincerely,<br>The Admin Team</p>
                        </div>
                        <div class="footer">
                            &copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.<br>
                            <a href="mailto:support@yourcompany.com" style="color: #ffffff;">support@yourcompany.com</a>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const formData = new FormData();
            formData.append('to', recipientEmail);
            formData.append('subject', emailSubject);
            formData.append('message', emailHtmlBody);

            if (emailAttachmentFileUpload.files.length > 0) {
                formData.append('attachment', emailAttachmentFileUpload.files[0]);
            }

            fetch('/api/admin/send-email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData,
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        handleUnauthorizedAccess();
                        return;
                    }
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error sending email');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showToast('Email sent successfully!', 'light-blue darken-1');
                    document.getElementById('sendEmailForm').reset();
                    M.updateTextFields();
                    const filePathInput = document.querySelector('#emailAttachmentFileUpload + .file-path-wrapper .file-path');
                    if (filePathInput) filePathInput.value = '';
                } else {
                    showToast(`Error sending email: ${data.message || 'Unknown error.'}`, 'red darken-2');
                }
            })
            .catch(error => {
                console.error('Error sending email:', error);
                showToast(`Network error or server issue while sending email: ${error.message}`, 'red darken-2');
            });
        });
    }

    // 2. Package File Upload Logic
    if (uploadPackageFileForm) {
        uploadPackageFileForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!attachFileTrackingIdSelect || !packageFileInput) {
                console.error("Critical error: 'attachFileTrackingIdSelect' or 'packageFileInput' not found.");
                showToast('Internal form error. Please contact support.', 'red darken-2');
                return;
            }

            const selectedTrackingMongoId = attachFileTrackingIdSelect.value;
            if (!selectedTrackingMongoId) {
                showToast('Please select a tracking ID to link the file to.', 'red darken-2');
                return;
            }

            if (packageFileInput.files.length === 0) {
                showToast('Please select a file to upload.', 'red darken-2');
                return;
            }

            const file = packageFileInput.files[0];
            const formData = new FormData();
            formData.append('packageFile', file);
            formData.append('trackingId', selectedTrackingMongoId);

            fetch('/api/admin/upload-package-file', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData,
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        handleUnauthorizedAccess();
                        return;
                    }
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error uploading file');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showToast('Package file uploaded and linked successfully!', 'green');
                    uploadPackageFileForm.reset();
                    const filePathInput = document.querySelector('#packageFileInput + .file-path-wrapper .file-path');
                    if (filePathInput) filePathInput.value = '';
                    M.FormSelect.init(attachFileTrackingIdSelect);
                } else {
                    showToast(`Error uploading file: ${data.message || 'Unknown error.'}`, 'red darken-2');
                }
            })
            .catch(error => {
                console.error('Error uploading package file:', error);
                showToast(`Network error or server issue during file upload: ${error.message}`, 'red darken-2');
            });
        });
    }

    // 3. User Management Logic
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
                        handleUnauthorizedAccess();
                        return;
                    }
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error creating user');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showToast('User created successfully!', 'green darken-2');
                    M.Modal.getInstance(createUserModal).close();
                    createUserForm.reset();
                    M.updateTextFields();
                    M.FormSelect.init(document.querySelectorAll('#createUserModal select'));
                    fetchAllUsers();
                } else {
                    showToast(`Error: ${data.message || 'Could not create user.'}`, 'red darken-2');
                }
            })
            .catch(error => {
                console.error('Error creating user:', error);
                showToast(`Network error or server issue: ${error.message}`, 'red darken-2');
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
                        handleUnauthorizedAccess();
                        return;
                    }
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error updating user');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showToast('User updated successfully!', 'green darken-2');
                    M.Modal.getInstance(editUserModal).close();
                    editUserForm.reset();
                    M.updateTextFields();
                    fetchAllUsers();
                } else {
                    showToast(`Error: ${data.message || 'Could not update user.'}`, 'red darken-2');
                }
            })
            .catch(error => {
                console.error('Error updating user:', error);
                showToast(`Network error or server issue: ${error.message}`, 'red darken-2');
            });
        });
    }

    // Delete Users
    if (deleteUserBtn) {
        deleteUserBtn.addEventListener('click', function() {
            const userId = userIdToDeleteInput.value;

            fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        handleUnauthorizedAccess();
                        return;
                    }
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error deleting user');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showToast('User deleted successfully!', 'red darken-2');
                    M.Modal.getInstance(deleteUserModalTrigger).close();
                    fetchAllUsers();
                } else {
                    showToast(`Error: ${data.message || 'Could not delete user.'}`, 'red darken-2');
                }
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                showToast(`Network error or server issue: ${error.message}`, 'red darken-2');
            });
        });
    }

});