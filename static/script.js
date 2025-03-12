// static/js/app.js

document.addEventListener('DOMContentLoaded', function() {
    // Elements for PDF upload
    const pdfForm = document.getElementById('pdf-form');
    const pdfPathInput = document.getElementById('pdf-path');
    const pdfResultDiv = document.getElementById('pdf-result');
    const pdfMessageDiv = document.getElementById('pdf-message');
    const pdfLoadingDiv = document.getElementById('pdf-loading');
    const documentsContainer = document.getElementById('documents-container');
    
    // Elements for search functionality
    const searchForm = document.getElementById('search-form');
    const queryInput = document.getElementById('query');
    const resultDiv = document.getElementById('result');
    const responseContainer = document.getElementById('response-container');
    const loadingDiv = document.getElementById('loading');
    
    // Elements for news functionality
    const newsContainer = document.getElementById('news-container');
    const newsLoadingDiv = document.getElementById('news-loading');
    const newsTab = document.getElementById('news-tab');
    
    // Load documents on page load
    loadDocuments();
    
    // Handle PDF form submission
    if (pdfForm) {
        pdfForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const pdfPath = pdfPathInput.value.trim();
            if (!pdfPath) return;
            
            // Show loading indicator
            pdfLoadingDiv.classList.remove('d-none');
            pdfResultDiv.classList.add('d-none');
            
            // Send request to add PDF
            fetch('/add_pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `pdf_path=${encodeURIComponent(pdfPath)}`
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading indicator
                pdfLoadingDiv.classList.add('d-none');
                pdfResultDiv.classList.remove('d-none');
                
                // Display result message
                if (data.success) {
                    pdfMessageDiv.className = 'alert alert-success';
                    pdfMessageDiv.textContent = data.message;
                    
                    // Clear the input
                    pdfPathInput.value = '';
                    
                    // Reload documents list
                    loadDocuments();
                } else {
                    pdfMessageDiv.className = 'alert alert-danger';
                    pdfMessageDiv.textContent = data.message;
                }
            })
            .catch(error => {
                pdfLoadingDiv.classList.add('d-none');
                pdfResultDiv.classList.remove('d-none');
                pdfMessageDiv.className = 'alert alert-danger';
                pdfMessageDiv.textContent = `An error occurred: ${error}`;
            });
        });
    }
    
    // Load documents list
    function loadDocuments() {
        if (!documentsContainer) return;
        
        documentsContainer.innerHTML = `
            <div class="text-center">
                <div class="spinner-border spinner-border-sm text-secondary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span class="ms-2">Loading documents...</span>
            </div>
        `;
        
        fetch('/api/documents')
        .then(response => response.json())
        .then(data => {
            if (data.count === 0) {
                documentsContainer.innerHTML = `
                    <div class="alert alert-info">
                        No documents have been added yet. Add a PDF file to get started.
                    </div>
                `;
                return;
            }
            
            // Build documents list
            let html = `
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Document</th>
                                <th>Path</th>
                                <th>Chunks</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            data.documents.forEach(doc => {
                html += `
                    <tr>
                        <td>${doc.source}</td>
                        <td><small class="text-muted">${doc.path}</small></td>
                        <td>${doc.chunks}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            documentsContainer.innerHTML = html;
        })
        .catch(error => {
            documentsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load documents: ${error}
                </div>
            `;
        });
    }
    
    // Handle search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const query = queryInput.value.trim();
            if (!query) return;
            
            // Show loading indicator
            loadingDiv.classList.remove('d-none');
            resultDiv.classList.add('d-none');
            
            // Send search request
            fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `query=${encodeURIComponent(query)}`
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading indicator
                loadingDiv.classList.add('d-none');
                resultDiv.classList.remove('d-none');
                
                // Display response
                if (data.error) {
                    responseContainer.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
                } else {
                    // Format the response with proper line breaks
                    const formattedResponse = data.response.replace(/\n/g, '<br>');
                    responseContainer.innerHTML = formattedResponse;
                }
            })
            .catch(error => {
                loadingDiv.classList.add('d-none');
                resultDiv.classList.remove('d-none');
                responseContainer.innerHTML = `<div class="alert alert-danger">An error occurred: ${error}</div>`;
            });
        });
    }
    
    // Load news when the news tab is clicked
    if (newsTab) {
        newsTab.addEventListener('click', loadNews);
    }
    
    // Function to load news
    function loadNews() {
        // Only load if the container is empty
        if (newsContainer && (newsContainer.children.length === 0)) {
            newsLoadingDiv.classList.remove('d-none');
            
            fetch('/api/news')
            .then(response => response.json())
            .then(data => {
                newsLoadingDiv.classList.add('d-none');
                
                if (data.length === 0) {
                    newsContainer.innerHTML = `<div class="alert alert-info">No news available at the moment.</div>`;
                    return;
                }
                
                // Build news items
                const newsHtml = data.map(item => `
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">${item.title}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${item.source} - ${item.published}</h6>
                            <p class="card-text">${item.summary}</p>
                            <a href="${item.link}" class="card-link" target="_blank">Read more</a>
                        </div>
                    </div>
                `).join('');
                
                newsContainer.innerHTML = newsHtml;
            })
            .catch(error => {
                newsLoadingDiv.classList.add('d-none');
                newsContainer.innerHTML = `<div class="alert alert-danger">Failed to load news: ${error}</div>`;
            });
        }
    }
    
    // CSS style for the app
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .card {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        #response-container {
            max-height: 500px;
            overflow-y: auto;
            white-space: pre-line;
        }
    `;
    document.head.appendChild(styleSheet);
});