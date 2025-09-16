#!/usr/bin/env node

const express = require('express');
const multer = require('multer');
const path = require('path');
const { verifyVC, verifyVP } = require('../dist/index.js');

const app = express();
const upload = multer();

app.use(express.urlencoded({ extended: true, limit: '2mb' }));
// Serve local static assets (place your logo at project_root/public/logo.png)
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

// Serve the main page
app.get('/', (req, res) => {
  res.send(htmlPage(''));
});

// Also serve the main page at /verify
app.get('/verify', (req, res) => {
  res.send(htmlPage(''));
});

function htmlPage(body, jwtPrefill = '', additionalScript = '') {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GS1 VC/VP Verifier</title>
  <style>
    body { 
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; 
      color: #1b1f23; 
      margin: 0;
      padding: 0;
      background-image: url('/static/bg.png');
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      min-height: 100vh;
    }
    
    .brand { 
      display: flex; 
      align-items: center; 
      justify-content: space-between;
      gap: 12px; 
      margin-bottom: 8px; 
      padding: 16px 24px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #e1e4e8;
      position: sticky;
      top: 0;
      z-index: 100;
      margin: 0;
    }
    
    .brand-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .brand-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .doc-link {
      color: #0366d6;
      text-decoration: none;
      font-weight: 600;
    }
    
    .brand img { height: 32px; width: auto; }
    h1 { margin: 0; font-size: 20px; color: #f36437; }
    
    .main { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      padding: 24px;
    }
    
    form { 
      display: grid; 
      gap: 12px; 
      width: 100%; 
      max-width: 900px; 
      margin: 0 auto; 
    }
    
    textarea { 
      width: 100%; 
      min-height: 140px; 
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; 
      box-sizing: border-box; 
    }
    
    .row { display: flex; gap: 12px; align-items: center; }
    
    button[type="submit"] {
      background-color: #f36437;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;
    }
    
    button[type="submit"]:hover {
      background-color: #e55a2b;
    }
    
    .loader {
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: none;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .btn-text {
      display: inline;
    }
    
    .loading-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(5px);
      z-index: 1000;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
    }
    
    .loading-step {
      font-size: 18px;
      font-weight: 600;
      color: #f36437;
      opacity: 0;
      animation: fadeInStep 0.5s ease-in-out forwards;
    }
    
    .loading-step:nth-child(1) { animation-delay: 0.5s; }
    .loading-step:nth-child(2) { animation-delay: 1.5s; }
    .loading-step:nth-child(3) { animation-delay: 2.5s; }
    
    .loading-dots {
      display: inline-block;
      width: 20px;
      text-align: left;
    }
    
    @keyframes dots {
      0%, 20% { content: ''; }
      40% { content: '.'; }
      60% { content: '..'; }
      80%, 100% { content: '...'; }
    }
    
    .loading-dots::after {
      content: '';
      animation: dots 1.5s infinite;
    }
    
    @keyframes fadeInStep {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .results-section {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .row-2col {
      display: flex;
      gap: 0px;
      align-items: flex-start;
      justify-content: center;
      margin-top: 16px;
    }
    
    .col {
      flex: 0 0 280px;
      display: flex;
      flex-direction: column;
    }
    
    .svg-col {
      flex: 0 0 224px;
      display: flex;
      flex-direction: column;
    }
    
    .vertical-layout {
      display: flex;
      flex-direction: column;
      gap: 0px;
    }
    
    .row-2col .card {
      margin-top: 8px;
      margin-bottom: 8px;
    }
    
    .card { 
      border: 1px solid #e1e4e8; 
      border-radius: 8px; 
      padding: 16px; 
      background: #fff; 
      width: fit-content;
    }
    
    .card-compact {
      width: fit-content;
    }
    
    .ok { color: #116329; font-weight: 600; }
    .bad { color: #b31d28; font-weight: 600; }
    
    .checks {
      margin-top: 12px;
    }
    
    .check-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .check-item img {
      width: 16px;
      height: 16px;
    }
    
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .kv { margin-top: 6px; }
    .kv dt { font-weight: 600; }
    .kv dd { margin: 0 0 6px 0; }
    .list { margin: 0; padding-left: 18px; }
    
    .json-link, .svg-link {
      color: #0366d6;
      text-decoration: none;
      font-size: 14px;
    }
    
    .copy-icon {
      width: 16px;
      height: 16px;
      margin-left: 8px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    
    .copy-icon:hover {
      opacity: 1;
    }
    
    .card-content {
      margin-top: 12px;
    }
    
    .card-header {
      margin-bottom: 12px;
    }
    
    .svg-container {
      display: none;
      text-align: center;
    }
    
    .svg-close-btn {
      background-color: #f36437;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      margin-top: 12px;
    }
    
    .credential-btn {
      background-color: #f36437;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      margin: 2px;
    }
    
    .credential-btn:hover {
      background-color: #e55a2b;
    }
  </style>
  </head>
<body>
  <div class="brand">
    <div class="brand-left">
      <img src="/static/gs1global.png" alt="GS1 Logo" />
    <h1>GS1 VC/VP Verifier</h1>
  </div>
    <div class="brand-right">
      <a href="https://gs1.github.io/GS1DigitalLicenses/" target="_blank" class="doc-link">DigitalLicense Document</a>
    </div>
  </div>
  
  <div class="main">
    <p>Paste a VC/VP JWT or upload a file.</p>
    <form action="/verify" method="post" enctype="multipart/form-data" id="verifyForm" onsubmit="return true;">
      <div class="row">
        <label for="mode">Mode</label>
        <select id="mode" name="mode">
          <option value="auto" selected>Auto</option>
          <option value="vc">VC</option>
          <option value="vp">VP</option>
        </select>
        <input type="file" name="file" accept=".jwt,.txt,.json" />
        <button type="submit">
          <span class="loader"></span>
          <span class="btn-text">Verify</span>
        </button>
      </div>
      <textarea name="jwt" placeholder="Paste VC/VP JWT here...">${jwtPrefill}</textarea>
    </form>
    
    <div class="loading-overlay" id="loadingOverlay">
      <div class="loading-step">Verifying signature<span class="loading-dots"></span></div>
      <div class="loading-step">Checking revocation status<span class="loading-dots"></span></div>
      <div class="loading-step">Validating GS1 rules<span class="loading-dots"></span></div>
  </div>
  </div>
  
  <div class="results-section" id="resultsSection">
  ${body || ''}
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const form = document.getElementById('verifyForm');
      const loadingOverlay = document.getElementById('loadingOverlay');
      const resultsSection = document.getElementById('resultsSection');
      const loader = document.querySelector('.loader');
      const btnText = document.querySelector('.btn-text');
      
      // Hide loading overlay if results are present
      if (resultsSection && resultsSection.innerHTML.trim() !== '') {
        loadingOverlay.style.display = 'none';
        resultsSection.style.display = 'block';
      }
      
      form.addEventListener('submit', function() {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        resultsSection.style.display = 'none';
        
        // Show spinner in button
        loader.style.display = 'inline-block';
        btnText.textContent = 'Verifying...';
      });
    });
    
    function toggleSvgDisplay(button) {
      const card = button.closest('.card');
      const cardHeader = card.querySelector('.card-header');
      const cardContent = card.querySelector('.card-content');
      const svgContainer = card.querySelector('.svg-container');
      
      if (svgContainer.style.display === 'none' || svgContainer.style.display === '') {
        cardHeader.style.display = 'none';
        cardContent.style.display = 'none';
        svgContainer.style.display = 'block';
      } else {
        cardHeader.style.display = 'block';
        cardContent.style.display = 'block';
        svgContainer.style.display = 'none';
      }
    }
    
    function toggleJsonDisplay(button) {
      const card = button.closest('.card');
      const jsonContent = card.querySelector('.json-content');
      const preElement = jsonContent.querySelector('pre');
      
      if (jsonContent.style.display === 'none' || jsonContent.style.display === '') {
        // Load raw credential data if not already loaded
        if (preElement.textContent === 'Loading raw credential data...') {
          const cardId = card.id;
          const credentialIndex = parseInt(cardId.replace('credential-card-', ''));
          
          if (window.credentialRawData && window.credentialRawData[credentialIndex]) {
            preElement.textContent = JSON.stringify(window.credentialRawData[credentialIndex], null, 2);
          } else {
            preElement.textContent = 'Raw credential data not available';
          }
        }
        
        jsonContent.style.display = 'block';
        button.textContent = 'Hide JSON';
      } else {
        jsonContent.style.display = 'none';
        button.textContent = 'View JSON';
      }
    }
    
    // Function to toggle SVG display for a specific credential
    async function toggleCredentialSvg(credentialIndex) {
      console.log('=== SVG BUTTON CLICKED ===');
      console.log('Credential index:', credentialIndex);
      console.log('window.credentialData available:', !!window.credentialData);
      console.log('window.credentialData length:', window.credentialData ? window.credentialData.length : 'undefined');
      
      const card = document.getElementById('credential-card-' + credentialIndex);
      const svgContent = document.getElementById('svg-content-' + credentialIndex);
      const svgDisplay = document.getElementById('svg-display-' + credentialIndex);
      
      console.log('Card element:', card);
      console.log('SVG content element:', svgContent);
      console.log('SVG display element:', svgDisplay);
      
      
      if (svgContent.style.display === 'none') {
        // Show SVG - hide other content and show SVG
        const cardContent = card.querySelector('div[style*="display: grid"]');
        const jsonContent = card.querySelector('.json-content');
        const viewJsonButton = card.querySelector('div[style*="text-align: right"]');
        
        // Store original display values for restoration
        if (cardContent) {
          cardContent.setAttribute('data-original-display', cardContent.style.display || 'grid');
          cardContent.style.display = 'none';
        }
        if (jsonContent) {
          jsonContent.setAttribute('data-original-display', jsonContent.style.display || 'none');
          jsonContent.style.display = 'none';
        }
        if (viewJsonButton) {
          viewJsonButton.setAttribute('data-original-display', viewJsonButton.style.display || 'block');
          viewJsonButton.style.display = 'none';
        }
        
        // Show SVG content
        svgContent.style.display = 'block';
        console.log('SVG content area shown');
        
        // Load SVG if not already loaded
        console.log('SVG display innerHTML:', svgDisplay.innerHTML);
        console.log('SVG display innerHTML trimmed:', svgDisplay.innerHTML.trim());
        
        // Check if SVG is already loaded (ignore HTML comments)
        const hasContent = svgDisplay.innerHTML.trim() && 
                          !svgDisplay.innerHTML.trim().startsWith('<!--') && 
                          svgDisplay.innerHTML.trim() !== '<!-- SVG will be loaded here -->';
        console.log('Has actual content:', hasContent);
        console.log('Should load SVG:', !hasContent);
        
        if (!hasContent) {
          console.log('Setting loading message...');
          svgDisplay.innerHTML = '<div style="padding: 20px; color: #666;">Loading SVG...</div>';
          
          try {
            // Get credential data from the page
            const credentialData = window.credentialData || [];
            console.log('Available credential data:', credentialData);
            console.log('Credential data length:', credentialData.length);
            console.log('Window credential data exists:', !!window.credentialData);
            const credential = credentialData[credentialIndex];
            console.log('Selected credential:', credential);
            
            if (credential) {
              console.log('Rendering SVG directly from credential data...');
              
              // Render SVG directly using credential data (no JWT fetching needed!)
              const svg = await renderSvgFromCredentialData(credential);
              console.log('SVG rendered, length:', svg.length);
              
              if (svg && svg.trim()) {
                svgDisplay.innerHTML = svg;
                console.log('SVG set in display area');
              } else {
                svgDisplay.innerHTML = '<div style="padding: 20px; color: #dc3545;">Failed to render SVG</div>';
                console.log('SVG rendering failed');
              }
            } else {
              console.log('ERROR: Credential data not available');
              svgDisplay.innerHTML = '<div style="padding: 20px; color: #dc3545;">Credential data not available</div>';
            }
          } catch (error) {
            console.error('SVG loading error:', error);
            svgDisplay.innerHTML = '<div style="padding: 20px; color: #dc3545;">Error loading SVG: ' + error.message + '</div>';
          }
        } else {
          console.log('SVG already loaded, skipping...');
        }
      } else {
        // Hide SVG - show other content
        closeCredentialSvg(credentialIndex);
      }
    }
    
    // Function to close SVG display and restore original content
    function closeCredentialSvg(credentialIndex) {
      console.log('=== CLOSING SVG FOR CREDENTIAL', credentialIndex, '===');
      const card = document.getElementById('credential-card-' + credentialIndex);
      const svgContent = document.getElementById('svg-content-' + credentialIndex);
      
      if (!card || !svgContent) {
        console.log('ERROR: Card or SVG content not found');
        return;
      }
      
      // Find all content elements - look for elements with stored original display values
      const allElementsWithData = card.querySelectorAll('[data-original-display]');
      console.log('Found elements with data-original-display:', allElementsWithData.length);
      
      // Hide SVG content
      svgContent.style.display = 'none';
      console.log('SVG content hidden');
      
      // Restore all elements with stored original display values
      allElementsWithData.forEach((element, index) => {
        const originalDisplay = element.getAttribute('data-original-display');
        element.style.display = originalDisplay;
        element.removeAttribute('data-original-display');
        console.log('Element ' + index + ' restored with display:', originalDisplay, 'Element:', element.tagName, element.className);
      });
      
      console.log('=== SVG CLOSED SUCCESSFULLY ===');
      
    }
    
    // Function to create a fallback SVG template when external templates are not available
    function createFallbackSvgTemplate(credential) {
      const credentialType = credential.rawPayload?.type?.find(t => t !== 'VerifiableCredential') || credential.credentialType || 'Unknown';
      const issuerName = credential.issuer?.name || 'Unknown Issuer';
      const organizationName = credential.rawPayload?.credentialSubject?.organization?.organizationName || 
                              credential.rawPayload?.credentialSubject?.organization?.['gs1:organizationName'] || 
                              'Unknown Organization';
      
      return '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2" rx="8"/>' +
        '<text x="20" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f36437">' + credentialType + '</text>' +
        '<text x="20" y="60" font-family="Arial, sans-serif" font-size="12" fill="#333">Issuer: ' + issuerName + '</text>' +
        '<text x="20" y="80" font-family="Arial, sans-serif" font-size="12" fill="#333">Organization: ' + organizationName + '</text>' +
        '<text x="20" y="100" font-family="Arial, sans-serif" font-size="12" fill="#333">Identification Key Type: ' + credentialType + '</text>' +
        '<text x="20" y="120" font-family="Arial, sans-serif" font-size="12" fill="#333">Status: Verified</text>' +
        '<text x="20" y="140" font-family="Arial, sans-serif" font-size="10" fill="#666">This is a fallback SVG template</text>' +
        '</svg>';
    }

    // Function to render SVG from credential data (no JWT fetching needed!)
    async function renderSvgFromCredentialData(credential) {
      try {
        console.log('=== RENDERING SVG FROM CREDENTIAL DATA ===');
        console.log('Credential:', credential);
        
        // Get SVG template URL from credential data
        let svgUrl = null;
        
        // Try to get renderMethod URL from credential data
        if (credential.renderMethod && credential.renderMethod[0] && credential.renderMethod[0].id) {
          svgUrl = credential.renderMethod[0].id;
          console.log('Using renderMethod URL:', svgUrl);
        } else {
          // Fallback to default templates based on credential type
          const credentialType = credential.credentialType || '';
          if (credentialType.includes('PrefixLicense')) {
            svgUrl = 'https://gs1.github.io/GS1DigitalLicenses/templates/gs1-sample-license-template.svg';
          } else if (credentialType.includes('Product')) {
            svgUrl = 'https://gs1.github.io/GS1DigitalLicenses/templates/gs1-product-template.svg';
          } else if (credentialType.includes('Company')) {
            svgUrl = 'https://gs1.github.io/GS1DigitalLicenses/templates/gs1-company-template.svg';
          } else {
            svgUrl = 'https://gs1.github.io/GS1DigitalLicenses/templates/gs1-sample-license-template.svg';
          }
          console.log('Using fallback URL for', credentialType, ':', svgUrl);
        }
        
        // Fetch SVG template
        console.log('Fetching SVG template from:', svgUrl);
        const response = await fetch(svgUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch SVG template: ' + response.status);
        }
        
        let svg = await response.text();
        console.log('SVG template fetched, length:', svg.length);
        console.log('SVG template preview:', svg.substring(0, 500) + '...');
        
        // Find placeholders in SVG
        console.log('=== ANALYZING SVG TEMPLATE ===');
        const placeholderMatches = svg.match(/\\[.*?\\]/g);
        console.log('Found placeholders in SVG:', placeholderMatches);
        
        // Replace placeholders with credential data - using actual placeholders from SVG
        const replacements = {
          // Common placeholders
          '[CREDENTIAL NAME]': credential.name || credential.credentialType || 'GS1 Credential',
          '[ORGANIZATION NAME]': credential.credentialSubject?.organization?.['gs1:organizationName'] || 'Unknown Organization',
          '[ORG NAME]': credential.credentialSubject?.organization?.['gs1:organizationName'] || 'Unknown Organization',
          '[LICENSE VALUE]': credential.credentialSubject?.licenseValue || '',
          '[ALTERNATIVE LICENSE VALUE]': credential.credentialSubject?.alternativeLicenseValue || '',
          '[ALTERNATE]': credential.credentialSubject?.alternativeLicenseValue || '',
          '[PREFIX]': credential.credentialSubject?.licenseValue || '',
          '[ISSUER NAME]': credential.issuer?.name || 'GS1 Global',
          '[ISSUER]': credential.issuer?.name || 'GS1 Global',
          '[VALID FROM]': credential.validFrom ? new Date(credential.validFrom).toLocaleDateString() : '',
          '[PARTY GLN]': credential.credentialSubject?.organization?.['gs1:partyGLN'] || '',
          '[CREDENTIAL DESCRIPTION]': credential.description || '',
          '[VC DESCRIPTION GOES HERE...]': credential.description || '',
          '[COMPANY NAME]': credential.credentialSubject?.organization?.['gs1:organizationName'] || 'Unknown Organization',
          '[LICENSE]': credential.credentialSubject?.licenseValue || '',
          '[GLN]': credential.credentialSubject?.organization?.['gs1:partyGLN'] || '',
          '[DATE]': credential.validFrom ? new Date(credential.validFrom).toLocaleDateString() : '',
          '[ISSUED DATE]': credential.validFrom ? new Date(credential.validFrom).toLocaleDateString() : '',
          // Extends credential
          '[VALUE]': credential.credentialSubject?.extendsCredential || 'N/A',
          '[EXTENDS]': credential.credentialSubject?.extendsCredential || 'N/A',
          '[EXTENDS CREDENTIAL]': credential.credentialSubject?.extendsCredential || 'N/A',
          // Identification Key Type - use the second field from type array (skip 'VerifiableCredential')
          '[IDENTIFICATION KEY TYPE]': (credential.rawPayload?.type && Array.isArray(credential.rawPayload.type) && credential.rawPayload.type.length > 1) 
            ? credential.rawPayload.type.find(t => t !== 'VerifiableCredential') || credential.rawPayload.type[1] || 'N/A'
            : 'N/A',
          '[KEY TYPE]': (credential.rawPayload?.type && Array.isArray(credential.rawPayload.type) && credential.rawPayload.type.length > 1) 
            ? credential.rawPayload.type.find(t => t !== 'VerifiableCredential') || credential.rawPayload.type[1] || 'N/A'
            : 'N/A'
        };
        
        console.log('Available replacements:', replacements);
        console.log('Credential data structure:', {
          name: credential.name,
          credentialType: credential.credentialType,
          issuer: credential.issuer,
          credentialSubject: credential.credentialSubject,
          validFrom: credential.validFrom
        });
        
        // Replace all placeholders
        let replacementCount = 0;
        for (const [placeholder, value] of Object.entries(replacements)) {
          const beforeLength = svg.length;
          svg = svg.split(placeholder).join(value);
          const afterLength = svg.length;
          if (beforeLength !== afterLength) {
            replacementCount++;
            console.log('✅ Replaced', placeholder, 'with', value);
          } else {
            console.log('❌ No match for placeholder:', placeholder);
          }
        }
        
        console.log('Total replacements made:', replacementCount);
        console.log('SVG rendering completed, final length:', svg.length);
        console.log('Final SVG preview:', svg.substring(0, 500) + '...');
        return svg;
        
      } catch (error) {
        console.error('Error rendering SVG from credential data:', error);
        return '<div style="padding: 20px; color: #dc3545;">Error rendering SVG: ' + error.message + '</div>';
      }
    }
    
    // SVG rendering function (client-side version)
    async function renderSvgFromPayload(payload) {
      try {
        if (!payload || !payload.credentialSubject) {
          return '';
        }
        
        const subject = payload.credentialSubject;
        const types = Array.isArray(payload.type) ? payload.type : [payload.type];
        
        // Get SVG template URL from renderMethod
        let svgTemplateUrl = '';
        if (payload.renderMethod && Array.isArray(payload.renderMethod) && payload.renderMethod.length > 0) {
          svgTemplateUrl = payload.renderMethod[0].id;
        }
        
        // Fallback to default templates
        if (!svgTemplateUrl) {
          if (types.some(t => t.includes('PrefixLicense'))) {
            svgTemplateUrl = 'https://gs1.github.io/GS1DigitalLicenses/templates/gs1-sample-license-template.svg';
          } else if (types.some(t => t.includes('Product'))) {
            svgTemplateUrl = 'https://gs1.github.io/GS1DigitalLicenses/templates/gs1-sample-license-template.svg';
          } else if (types.some(t => t.includes('Company'))) {
            svgTemplateUrl = 'https://gs1.github.io/GS1DigitalLicenses/templates/gs1-sample-license-template.svg';
          }
        }
        
        if (!svgTemplateUrl) {
          return '';
        }
        
        // Fetch SVG template
        const response = await fetch(svgTemplateUrl);
        if (!response.ok) {
          return '';
        }
        
        let svgTemplate = await response.text();
        
        // Replace placeholders
        const orgName = subject.organization?.['gs1:organizationName'] || subject.organization?.organizationName || 'N/A';
        const licenseValue = subject.licenseValue || 'N/A';
        const altLicenseValue = subject.alternativeLicenseValue || 'N/A';
        const issuerName = payload.issuer?.name || 'N/A';
        const credentialName = payload.name || 'N/A';
        const credentialDescription = payload.description || 'N/A';
        const gln = subject.organization?.['gs1:partyGLN'] || subject.organization?.partyGLN || 'N/A';
        
        
        svgTemplate = svgTemplate.replace(/\[ORG NAME\]/g, orgName);
        svgTemplate = svgTemplate.replace(/\[LICENSE\]/g, licenseValue);
        svgTemplate = svgTemplate.replace(/\[VALUE\]/g, licenseValue);
        svgTemplate = svgTemplate.replace(/\[ALTERNATE\]/g, altLicenseValue);
        svgTemplate = svgTemplate.replace(/\[ISSUER\]/g, issuerName);
        svgTemplate = svgTemplate.replace(/\[CREDENTIAL NAME\]/g, credentialName);
        svgTemplate = svgTemplate.replace(/\[VC DESCRIPTION GOES HERE\.\.\.\]/g, credentialDescription);
        svgTemplate = svgTemplate.replace(/\[GLN\]/g, gln);
        
        return svgTemplate;
      } catch (error) {
        return '';
      }
    }
    
    function closeSvgView(closeButton) {
      const card = closeButton.closest('.card');
      const cardHeader = card.querySelector('.card-header');
      const cardContent = card.querySelector('.card-content');
      const svgContainer = card.querySelector('.svg-container');
      
      cardHeader.style.display = 'block';
      cardContent.style.display = 'block';
      svgContainer.style.display = 'none';
    }
    
    function copyToClipboard(text, icon) {
      navigator.clipboard.writeText(text).then(function() {
        const originalSrc = icon.src;
        icon.src = '/static/check-mark.png';
        setTimeout(() => {
          icon.src = originalSrc;
        }, 1000);
      });
    }
  </script>
  ${additionalScript}
</body>
</html>`;
}

function decodeBase64UrlSegment(seg) {
  try {
    const b64 = seg.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 2 ? '==' : b64.length % 4 === 3 ? '=' : '';
    return Buffer.from(b64 + pad, 'base64').toString('utf8');
  } catch { return ''; }
}

function escapeHtml(s) {
  try {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  } catch {
    return '';
  }
}

function detectIsVP(jwt) {
  try {
    const parts = String(jwt).split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(decodeBase64UrlSegment(parts[1]));
    if (!payload) return false;
    if (Array.isArray(payload.type) && payload.type.includes('VerifiablePresentation')) return true;
    if (payload.verifiableCredential) return true;
    return false;
  } catch { return false; }
}

function formatDateReadable(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

function buildEngagementChecks(gs1) {
  if (!gs1 || !Array.isArray(gs1.engagementChecks)) return '';
  
  const checks = gs1.engagementChecks.map(check => {
    const status = check.verified ? 'ok' : 'bad';
    const message = check.verified ? 'Verified' : 'Failed';
    return `<div class="check-item">
      <img src="/static/check-mark.png" alt="Check" />
      <span class="${status}">${message}: ${check.description || 'Engagement check'}</span>
    </div>`;
  }).join('');
  
  return `<div class="checks">${checks}</div>`;
}

function decodeJwtPayloadSafeFromText(jwt) {
  try {
    const parts = String(jwt).split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(decodeBase64UrlSegment(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

function extractTypes(credential) {
  if (!credential || !credential.type) return [];
  return Array.isArray(credential.type) ? credential.type : [credential.type];
}

async function renderSvgFromPayload(payload) {
  try {
    if (!payload || !payload.credentialSubject) return '';
    
    const subject = payload.credentialSubject;
    const types = extractTypes(payload);
    
    // Get SVG template URL from renderMethod in the credential
    let svgTemplateUrl = '';
    if (payload.renderMethod && Array.isArray(payload.renderMethod) && payload.renderMethod.length > 0) {
      svgTemplateUrl = payload.renderMethod[0].id;
    }
    
    // Fallback to default templates based on credential type
    if (!svgTemplateUrl) {
      if (types.some(t => t.includes('PrefixLicense'))) {
        svgTemplateUrl = 'https://gs1.github.io/GS1DigitalLicenses/samples/gs1-prefix-license-template.svg';
      } else if (types.some(t => t.includes('Product'))) {
        svgTemplateUrl = 'https://gs1.github.io/GS1DigitalLicenses/samples/gs1-product-license-template.svg';
      } else if (types.some(t => t.includes('Company'))) {
        svgTemplateUrl = 'https://gs1.github.io/GS1DigitalLicenses/samples/gs1-company-prefix-license-template.svg';
      }
    }
    
    if (!svgTemplateUrl) return '';
    
    // Fetch SVG template
    let svgTemplate = '';
    try {
      const response = await fetch(svgTemplateUrl);
      if (response.ok) {
        svgTemplate = await response.text();
      } else {
        // Use fallback template instead of returning empty
        svgTemplate = createFallbackSvgTemplate(credential);
      }
    } catch (fetchError) {
      // Use fallback template instead of returning empty
      svgTemplate = createFallbackSvgTemplate(credential);
    }
    
    if (!svgTemplate) return '';
    
    // Replace placeholders with actual data
    let renderedSvg = svgTemplate;
    
    // Debug: Log the data we're working with
    // Find placeholders in SVG template
    const placeholderMatches = svgTemplate.match(/\[[^\]]+\]/g);
    
    // Replace organization name (handle both gs1:organizationName and organizationName)
    const orgName = subject.organization?.['gs1:organizationName'] || subject.organization?.organizationName || 'N/A';
    renderedSvg = renderedSvg.replace(/\[ORG NAME\]/g, orgName);
    renderedSvg = renderedSvg.replace(/\[organizationName\]/g, orgName);
    renderedSvg = renderedSvg.replace(/\[orgName\]/g, orgName);
    
    // Replace license value
    const licenseValue = subject.licenseValue || 'N/A';
    renderedSvg = renderedSvg.replace(/\[LICENSE\]/g, licenseValue);
    renderedSvg = renderedSvg.replace(/\[VALUE\]/g, licenseValue);
    renderedSvg = renderedSvg.replace(/\[licenseValue\]/g, licenseValue);
    renderedSvg = renderedSvg.replace(/\[prefix\]/g, licenseValue);
    
    // Replace alternative license value
    const altLicenseValue = subject.alternativeLicenseValue || 'N/A';
    renderedSvg = renderedSvg.replace(/\[ALTERNATE\]/g, altLicenseValue);
    renderedSvg = renderedSvg.replace(/\[alternativeLicenseValue\]/g, altLicenseValue);
    
    // Replace issuer name
    const issuerName = payload.issuer?.name || 'N/A';
    renderedSvg = renderedSvg.replace(/\[ISSUER\]/g, issuerName);
    renderedSvg = renderedSvg.replace(/\[issuerName\]/g, issuerName);
    renderedSvg = renderedSvg.replace(/\[issuer\]/g, issuerName);
    
    // Replace credential name
    const credentialName = payload.name || 'N/A';
    renderedSvg = renderedSvg.replace(/\[CREDENTIAL NAME\]/g, credentialName);
    renderedSvg = renderedSvg.replace(/\[credentialName\]/g, credentialName);
    
    // Replace credential description
    const credentialDescription = payload.description || 'N/A';
    renderedSvg = renderedSvg.replace(/\[VC DESCRIPTION GOES HERE\.\.\.\]/g, credentialDescription);
    renderedSvg = renderedSvg.replace(/\[description\]/g, credentialDescription);
    
    // Replace GLN if available
    const gln = subject.organization?.['gs1:partyGLN'] || subject.organization?.partyGLN || 'N/A';
    renderedSvg = renderedSvg.replace(/\[GLN\]/g, gln);
    renderedSvg = renderedSvg.replace(/\[partyGLN\]/g, gln);
    
    
    return renderedSvg;
  } catch (error) {
    return '';
  }
}

async function fetchCredentialInfo(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const jwt = await response.text();
    const payload = decodeJwtPayloadSafeFromText(jwt);
    const renderedSvg = await renderSvgFromPayload(payload);
    
    return { jwt, payload, renderedSvg };
  } catch (error) {
    console.error('Error fetching credential:', error);
    return null;
  }
}

// Function to render SVG for credential chain
async function renderCredentialChainSvg(credentials) {
  if (!credentials || credentials.length === 0) return '';
  
  // For now, render SVG for the first credential (main credential)
  const mainCredential = credentials[0];
  if (mainCredential && mainCredential.credentialId) {
    try {
      console.log('Fetching credential for SVG rendering:', mainCredential.credentialId);
      const response = await fetch(mainCredential.credentialId);
      if (response.ok) {
        const jwtText = await response.text();
        console.log('JWT fetched, length:', jwtText.length);
        
        // Use the proper decode function
        const payload = decodeJwtPayloadSafeFromText(jwtText);
        console.log('Decoded payload for SVG:', payload);
        
        if (payload) {
          return await renderSvgFromPayload(payload);
        } else {
          console.log('Failed to decode payload for SVG rendering');
        }
      } else {
        console.log('Failed to fetch credential for SVG:', response.status);
      }
    } catch (error) {
      console.log('Error rendering credential chain SVG:', error.message);
    }
  }
  
  return '';
}

function renderGs1Chain(gs1) {
  console.log('renderGs1Chain called with:', gs1);
  if (!gs1 || !Array.isArray(gs1.credentialChain)) {
    console.log('No credential chain found or not an array');
    return '';
  }
  
  console.log('Credential chain found:', gs1.credentialChain.length, 'items');
  
  const chainItems = gs1.credentialChain.map(async (cred, idx) => {
    const credentialInfo = await fetchCredentialInfo(cred.url);
    if (!credentialInfo) return '';
    
    const { payload, renderedSvg } = credentialInfo;
    const subject = payload?.credentialSubject || {};
    const organization = subject.organization || {};
    
    const issuedToLine = `<div><span style="font-weight: 600;">Issued to</span> <img src="/static/arrow-right.png" alt="→" style="width: 12px; height: 12px; margin: 0 4px;" /> ${organization.organizationName || 'N/A'}</div>`;
    
    const issuerNameLine = `<div><span style="font-weight: 600;">Issued by</span> <img src="/static/arrow-right.png" alt="→" style="width: 12px; height: 12px; margin: 0 4px;" /> ${payload?.issuer?.name || 'N/A'}</div>`;
    
    const issuerDidLine = `<div><span style="font-weight: 600;">Issuer DID</span> <img src="/static/arrow-right.png" alt="→" style="width: 12px; height: 12px; margin: 0 4px;" /> <a href="${payload?.issuer?.id || '#'}" target="_blank">${payload?.issuer?.id || 'N/A'}</a> <img src="/static/copy.png" alt="Copy" class="copy-icon" onclick="copyToClipboard('${payload?.issuer?.id || ''}', this)" /></div>`;
    
    const licenseValueLine = `<div><span style="font-weight: 600;">License Value</span> <img src="/static/arrow-right.png" alt="→" style="width: 12px; height: 12px; margin: 0 4px;" /> ${subject.licenseValue || 'N/A'}</div>`;
    
    const validFromLine = `<div><span style="font-weight: 600;">Valid From</span> <img src="/static/arrow-right.png" alt="→" style="width: 12px; height: 12px; margin: 0 4px;" /> ${formatDateReadable(payload?.validFrom || '')}</div>`;
    
    const svgBlock = renderedSvg ? `
      <div class="svg-container">
        <div style="max-width: 100%; overflow: auto;">
          ${renderedSvg}
        </div>
        <button class="svg-close-btn credential-btn" onclick="closeSvgView(this)">Close</button>
      </div>
    ` : '';
    
    const svgContainer = renderedSvg ? `
      <details>
        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 8px;">SVG View</summary>
        <div style="max-width: 100%; overflow: auto; margin-top: 8px;">
          ${renderedSvg}
        </div>
      </details>
    ` : '';
    
    return `
      <div class="card" style="border-left: 4px solid #f36437; margin-bottom: 16px;">
        <div class="card-header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="/static/gs1global.png" alt="GS1" style="width: 24px; height: 24px;" />
              <strong>${credentialType}</strong>
        </div>
            <div>
              <button class="credential-btn" onclick="toggleJsonDisplay(this)">View JSON</button>
            </div>
          </div>
        </div>
        <div class="card-content">
          <div style="margin-bottom: 8px;">
            <a href="${cred.url}" target="_blank" style="color: #0366d6; text-decoration: none; font-size: 14px;">${cred.url}</a>
          </div>
          <div style="color: #666; font-size: 14px;">
            Valid From: ${formatDateReadable(payload?.validFrom || '')}
          </div>
          ${payload?.credentialSubject ? `
            <div style="margin-top: 8px; font-size: 14px;">
              <div><span style="font-weight: 600;">Issued to:</span> ${payload.credentialSubject.organization?.organizationName || 'N/A'}</div>
              <div><span style="font-weight: 600;">Issued by:</span> ${payload.issuer?.name || 'N/A'}</div>
              ${payload.credentialSubject.licenseValue ? `<div><span style="font-weight: 600;">License Value:</span> ${payload.credentialSubject.licenseValue}</div>` : ''}
            </div>
          ` : ''}
        </div>
        <div class="json-content" style="display: none; margin-top: 12px;">
          <pre style="background: #f6f8fa; padding: 12px; border-radius: 4px; overflow: auto; max-height: 300px; font-size: 12px;">${JSON.stringify(payload, null, 2)}</pre>
        </div>
      </div>
    `;
  });
  
  return Promise.all(chainItems).then(items => items.join(''));
}

function renderGs1TypeCoverage(gs1) {
  if (!gs1 || !gs1.typeCoverage) return '';
  
  const coverage = gs1.typeCoverage;
  const items = [];
  
  if (coverage.credentialTypes) {
    items.push(`<div class="kv"><dt>Credential Types</dt><dd>${coverage.credentialTypes.join(', ')}</dd></div>`);
  }
  
  if (coverage.subjectTypes) {
    items.push(`<div class="kv"><dt>Subject Types</dt><dd>${coverage.subjectTypes.join(', ')}</dd></div>`);
  }
  
  return items.length ? `<div class="kv"><dt>GS1 Type Coverage</dt><dd>${items.join('')}</dd></div>` : '';
}

function renderRevocationSummary(result) {
  if (!result.revocationResult) return '';
  
  const rev = result.revocationResult;
  const status = rev.verified ? 'ok' : 'bad';
  const message = rev.verified ? 'Not Revoked' : 'Revoked';
  
  return `<div class="kv"><dt>Revocation Status</dt><dd><span class="${status}">${message}</span></dd></div>`;
}

// SVG rendering endpoint
app.post('/render-svg', async (req, res) => {
  try {
    const { jwt } = req.body;
    
    if (!jwt) {
      return res.status(400).send('JWT is required');
    }
    
    // Decode JWT payload
    const payload = decodeJwtPayloadSafeFromText(jwt);
    if (!payload) {
      return res.status(400).send('Invalid JWT');
    }
    
    // Render SVG using existing server-side logic
    const svg = await renderSvgFromPayload(payload);
    
    if (svg) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
    } else {
      res.status(500).send('Failed to render SVG');
    }
  } catch (error) {
    res.status(500).send('Error rendering SVG: ' + error.message);
  }
});

app.post('/verify', upload.single('file'), async (req, res) => {
  try {
    const { jwt, mode } = req.body;
    let jwtText = jwt || '';
    
    // Handle file upload
    if (req.file) {
      jwtText = req.file.buffer.toString('utf8');
    }

    if (!jwtText.trim()) {
      return res.status(400).send(htmlPage('<p class="bad">Please provide a JWT or upload a file.</p>'));
    }

    const isVP = mode === 'vp' || (mode === 'auto' && detectIsVP(jwtText));

    let result;
    console.log('=== VERIFICATION START ===');
    console.log('isVP:', isVP);
    console.log('jwtText length:', jwtText.length);
    
    if (isVP) {
      result = await verifyVP(jwtText);
    } else {
      result = await verifyVC(jwtText);
    }
    
    console.log('=== VERIFICATION COMPLETE ===');
    console.log('result type:', typeof result);
    console.log('result keys:', Object.keys(result || {}));

    const verified = !!result.verified;
    
    // Debug the entire result structure
    console.log('=== FULL RESULT DEBUG ===');
    console.log('result:', JSON.stringify(result, null, 2));
    console.log('result.verified:', result.verified);
    console.log('result.validationResult:', result.validationResult);
    
    // Individual verification checks (matching CLI format exactly)
    const signatureVerified = !!(result && result.validationResult && result.validationResult.verified === true);
    
    // Debug schema validation
    console.log('=== SCHEMA VALIDATION DEBUG ===');
    console.log('result.validationResult:', result.validationResult);
    console.log('result.validationResult.schema:', result.validationResult?.schema);
    
    // Schema validation logic (matching CLI test-vc.js)
    const schemaValid = !!(result && result.validationResult && result.validationResult.schema && 
      Object.values(result.validationResult.schema).every((r) => r && r.validation === 'succeeded'));
    
    console.log('schemaValid result:', schemaValid);
    
    // Debug logging for revocation status
    console.log('=== REVOCATION DEBUG ===');
    console.log('result.revocationStatusPresent:', result?.revocationStatusPresent);
    console.log('result.revocationCheck:', result?.revocationCheck);
    console.log('result.revoked:', result?.revoked);
    console.log('result.verified:', result?.verified);
    
    const revocationOk = result && result.revocationStatusPresent ? (result.revocationCheck === 'checked' && !result.revoked) : false;
    console.log('revocationOk calculated as:', revocationOk);
    const gs1Ok = !!(result && result.gs1ValidationResult && result.gs1ValidationResult.verified === true);
    
    // Check if jose fallback was used
    const joseFallbackUsed = result.errors && result.errors.some(error => 
      error.details && typeof error.details === 'string' && error.details.includes('jose fallback used')
    );
    
    
    const coverage = result.gs1ValidationResult ? renderGs1TypeCoverage(result.gs1ValidationResult) : '';
    const revocation = renderRevocationSummary(result);
    const engagementChecks = result.gs1ValidationResult ? buildEngagementChecks(result.gs1ValidationResult) : '';
    
    const headerLeft = `<div class="card card-compact">
      <div><strong>Result</strong> ${verified ? '<span class="ok">verified <img src="/static/check-mark.png" alt="Verified" style="width: 16px; height: 16px; vertical-align: middle;"></span>' : '<span class="bad">not verified ❌</span>'}</div>
      
      <div style="margin-top: 16px;">
        <div class="check-item">
          <span><strong style="color: #000;">Signature:</strong> ${signatureVerified ? '<span class="ok">Verified <img src="/static/check-mark.png" alt="Verified" style="width: 16px; height: 16px; vertical-align: middle;"></span>' : '<span class="bad">Failed ❌</span>'}</span>
          ${joseFallbackUsed ? '<div style="font-size: 12px; color: #666; margin-top: 4px;">(using jose fallback)</div>' : ''}
        </div>
        <div class="check-item">
          <span><strong style="color: #000;">Schema:</strong> ${schemaValid ? '<span class="ok">Validated <img src="/static/check-mark.png" alt="Validated" style="width: 16px; height: 16px; vertical-align: middle;"></span>' : '<span class="bad">Failed ❌</span>'}</span>
        </div>
        <div class="check-item">
          <span><strong style="color: #000;">Revocation:</strong> ${revocationOk ? '<span class="ok">Not revoked <img src="/static/check-mark.png" alt="Not revoked" style="width: 16px; height: 16px; vertical-align: middle;"></span>' : '<span class="bad">Revoked ❌</span>'}</span>
          ${result && !result.revocationStatusPresent ? '<div style="font-size: 12px; color: #666; margin-top: 4px;">(no status present)</div>' : ''}
        </div>
        <div class="check-item">
          <span><strong style="color: #000;">GS1 rules:</strong> ${gs1Ok ? '<span class="ok">Validated <img src="/static/check-mark.png" alt="Validated" style="width: 16px; height: 16px; vertical-align: middle;"></span>' : '<span class="bad">Failed ❌</span>'}</span>
        </div>
        ${!verified ? '<div class="check-item" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e1e4e8;"><span style="color: #666; font-size: 14px;">Please refer <a href="https://gs1.github.io/GS1DigitalLicenses/" target="_blank" style="color: #0366d6; text-decoration: none;">Digital License document</a> for more information.</span></div>' : ''}
      </div>
      
      <!-- Summary Section (matching CLI format) -->
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e1e4e8;">
        <div style="font-weight: 600; margin-bottom: 8px;">Summary</div>
        <div style="font-size: 14px; color: #666;">
          <div>Verified: ${verified ? 'true' : 'false'}</div>
          <div>Revoked: ${result.revoked ? 'true' : 'false'}</div>
        </div>
      </div>
    </div>`;

    // Main credential SVG section
    let svgSection = '';
    try {
      console.log('=== MAIN SVG RENDERING ===');
      console.log('Input JWT length:', jwtText.length);
      const inputPayload = decodeJwtPayloadSafeFromText(jwtText);
      console.log('Decoded input payload:', inputPayload);
      
      const mainSvg = inputPayload ? await renderSvgFromPayload(inputPayload) : '';
      console.log('Main SVG rendered, length:', mainSvg.length);
      
      svgSection = mainSvg ? `
        <div class="card">
          <div style="max-width: 100%; overflow: auto;">
            ${mainSvg}
          </div>
        </div>
      ` : '';
    } catch (svgError) {
      console.log('SVG rendering failed, continuing without SVG:', svgError.message);
      svgSection = '';
    }

    // GS1 chain view
    let summary = '';
    if (result.gs1ValidationResult) {
      summary = await renderGs1Chain(result.gs1ValidationResult);
    }

    // Credential Results Cards - REMOVED as requested
    const credentialCards = [];

    const errors = Array.isArray(result.errors) && result.errors.length
      ? `<div class="card"><div><strong>Errors</strong></div><ul class="list">${result.errors.map(e => `<li><span class="mono">${(e && e.error) ? String(e.error) : String(e)}</span></li>`).join('')}</ul></div>`
      : '';

    // Main verification result and SVG section
    const mainSection = `<div class="row-2col">
      <div class="col">
        <div class="vertical-layout">
          ${headerLeft}
        </div>
      </div>
      <div class="svg-col">
        ${svgSection}
      </div>
    </div>`;

    // Credential Results section - REMOVED as requested
    const credentialResultsSection = '';

    // GS1 Section disabled (per request): keep variable defined to avoid breaking layout
    const gs1Section = '';

    // Credential chain section at the bottom
    const credentialChainSection = summary ? `
      <div style="margin-top: 24px;">
        <div style="font-weight: 600; font-size: 18px; margin-bottom: 16px; color: #f36437;">Credential Chain</div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${summary}
        </div>
      </div>
    ` : '';

    // Extract credential data from result object
    async function extractCredentialsFromResult(result) {
      const credentials = [];
      
      // Check if credentials are in gs1ValidationResult.result (the correct path)
      if (result.gs1ValidationResult && result.gs1ValidationResult.result && Array.isArray(result.gs1ValidationResult.result)) {
        for (const [idx, cred] of result.gs1ValidationResult.result.entries()) {
          const credentialData = {
            index: idx,
            credentialType: cred.credentialType || 'Unknown',
            credentialId: cred.url || cred.credentialId || 'No URL',
            verified: cred.verified || true
          };
          
          // Fetch detailed credential data
          if (credentialData.credentialId && credentialData.credentialId !== 'No URL') {
            try {
              const response = await fetch(credentialData.credentialId);
              if (response.ok) {
                const jwtText = await response.text();
                const payload = JSON.parse(atob(jwtText.split('.')[1]));
                
                // Extract credential type (remove 'VerifiableCredential' from types array)
                const types = Array.isArray(payload.type) ? payload.type : [payload.type];
                const credentialType = types.find(t => t !== 'VerifiableCredential') || types[0] || 'Unknown';
                
                credentialData.credentialType = credentialType;
                credentialData.issuer = payload.issuer;
                credentialData.credentialSubject = payload.credentialSubject;
                credentialData.validFrom = payload.validFrom;
                credentialData.name = payload.name;
                credentialData.description = payload.description;
                credentialData.rawPayload = payload; // Store the complete raw payload
              } else {
              }
            } catch (error) {
            }
          }
          
          credentials.push(credentialData);
        }
      }
      
      // Fallback: Check if credentials are in gs1ValidationResult.credentialChain (old path)
      if (credentials.length === 0 && result.gs1ValidationResult && result.gs1ValidationResult.credentialChain) {
        for (const [idx, cred] of result.gs1ValidationResult.credentialChain.entries()) {
          const credentialData = {
            index: idx,
            credentialType: cred.credentialType || 'Unknown',
            credentialId: cred.url || cred.credentialId || 'No URL',
            verified: cred.verified || true
          };
          
          // Fetch detailed credential data
          if (credentialData.credentialId && credentialData.credentialId !== 'No URL') {
            try {
              const response = await fetch(credentialData.credentialId);
              if (response.ok) {
                const jwtText = await response.text();
                const payload = JSON.parse(atob(jwtText.split('.')[1]));
                
                // Extract credential type (remove 'VerifiableCredential' from types array)
                const types = Array.isArray(payload.type) ? payload.type : [payload.type];
                const credentialType = types.find(t => t !== 'VerifiableCredential') || types[0] || 'Unknown';
                
                credentialData.credentialType = credentialType;
                credentialData.issuer = payload.issuer;
                credentialData.credentialSubject = payload.credentialSubject;
                credentialData.validFrom = payload.validFrom;
                credentialData.name = payload.name;
                credentialData.description = payload.description;
                credentialData.rawPayload = payload; // Store the complete raw payload
              } else {
              }
            } catch (error) {
            }
          }
          
          credentials.push(credentialData);
        }
      }
      
      // Check if credentials are in credentialResults
      if (result.credentialResults && result.credentialResults.length > 0) {
        for (const [idx, cred] of result.credentialResults.entries()) {
          const credentialData = {
            index: idx,
            credentialType: cred.credentialType || 'Unknown',
            credentialId: cred.credentialId || 'No URL',
            verified: cred.verified || true
          };
          
          // Fetch detailed credential data
          if (credentialData.credentialId && credentialData.credentialId !== 'No URL') {
            try {
              const response = await fetch(credentialData.credentialId);
              if (response.ok) {
                const jwtText = await response.text();
                const payload = JSON.parse(atob(jwtText.split('.')[1]));
                
                // Extract credential type (remove 'VerifiableCredential' from types array)
                const types = Array.isArray(payload.type) ? payload.type : [payload.type];
                const credentialType = types.find(t => t !== 'VerifiableCredential') || types[0] || 'Unknown';
                
                credentialData.credentialType = credentialType;
                credentialData.issuer = payload.issuer;
                credentialData.credentialSubject = payload.credentialSubject;
                credentialData.validFrom = payload.validFrom;
                credentialData.name = payload.name;
                credentialData.description = payload.description;
                credentialData.rawPayload = payload; // Store the complete raw payload
              } else {
              }
            } catch (error) {
            }
          }
          
          credentials.push(credentialData);
        }
      }
      
      // Check if there are any other credential arrays in the result
      Object.keys(result).forEach(key => {
        if (Array.isArray(result[key]) && result[key].length > 0) {
        }
      });
      
      return credentials;
    }
    
    // Create credential chain from extracted credentials
    let gs1CredentialChain = '';
    
    // Check if we have GS1 result with credentials
    let extractedCredentials = [];
    console.log('=== DEBUGGING CREDENTIAL EXTRACTION ===');
    console.log('result.gs1ValidationResult exists:', !!result.gs1ValidationResult);
    if (result.gs1ValidationResult) {
      console.log('gs1ValidationResult keys:', Object.keys(result.gs1ValidationResult));
      console.log('gs1ValidationResult.result exists:', !!result.gs1ValidationResult.result);
      console.log('gs1ValidationResult.result is array:', Array.isArray(result.gs1ValidationResult.result));
      if (result.gs1ValidationResult.result) {
        console.log('gs1ValidationResult.result length:', result.gs1ValidationResult.result.length);
      }
    }
    
    if (result.gs1ValidationResult && result.gs1ValidationResult.result && Array.isArray(result.gs1ValidationResult.result)) {
      console.log('Found GS1 result array:', result.gs1ValidationResult.result);
      extractedCredentials = await extractCredentialsFromResult(result);
    } else {
      console.log('No GS1 result array found, trying alternative extraction');
      extractedCredentials = await extractCredentialsFromResult(result);
    }
    
    
    console.log('Extracted credentials:', extractedCredentials);
    
    if (extractedCredentials.length > 0) {
      console.log('Creating credential chain from extracted credentials:', extractedCredentials.length, 'items');
      
      // Render SVG for the credential chain
      const credentialChainSvg = await renderCredentialChainSvg(extractedCredentials);
      if (credentialChainSvg) {
        console.log('Credential chain SVG rendered successfully');
      }
      
      const chainContent = extractedCredentials.map((cred, idx) => {
        console.log(`Credential ${idx}:`, cred);
        
        // Format the credential type for display
        const displayType = cred.credentialType || 'Unknown Credential';
        
        // Extract issuer information
        const issuerName = cred.issuer?.name || 'Unknown Issuer';
        const issuerDid = cred.issuer?.id || 'Unknown DID';
        
        // Extract organization information
        const organizationName = cred.credentialSubject?.organization?.['gs1:organizationName'] || 
                                cred.credentialSubject?.organization?.organizationName || 
                                'Unknown Organization';
        
        // Format issued date
        const issuedDate = cred.validFrom ? new Date(cred.validFrom).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'Unknown Date';
        
        return `
          <div class="card" id="credential-card-${idx}" style="border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; background: #fff; margin-bottom: 20px; width: 100%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Card Header -->
            <div style="border-bottom: 2px solid #f36437; padding-bottom: 12px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <img src="/static/gs1global.png" alt="GS1" style="width: 28px; height: 28px;" />
                  <h3 style="margin: 0; color: #f36437; font-size: 18px; font-weight: 600;">${displayType}</h3>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button onclick="toggleCredentialSvg(${idx})" style="background: #f36437; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Rendered</button>
                  <a href="#" onclick="toggleJsonDisplay(this); return false;" style="color: #0366d6; text-decoration: none; font-size: 12px; padding: 6px 12px; border: 1px solid #0366d6; border-radius: 4px; display: inline-block; font-weight: 600;">View JSON</a>
                </div>
              </div>
            </div>
            
            <!-- Card Content -->
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="color: #333; min-width: 80px;">Issued by</strong>
                  <img src="/static/arrow-right.png" alt="→" style="width: 12px; height: 12px; margin: 0 4px;" />
                  <span style="color: #666;">${issuerName}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: ${cred.verified ? '#28a745' : '#dc3545'}; font-weight: 600;">
                    ${cred.verified ? 'Verified <img src="/static/check-mark.png" alt="Verified" style="width: 16px; height: 16px; vertical-align: middle;">' : '❌ Failed'}
                  </span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong style="color: #333; min-width: 80px;">Issued to</strong>
                <img src="/static/arrow-right.png" alt="→" style="width: 12px; height: 12px; margin: 0 4px;" />
                <span style="color: #666;">${organizationName}</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong style="color: #333; min-width: 80px;">Issued Date</strong>
                <img src="/static/arrow-right.png" alt="→" style="width: 12px; height: 12px; margin: 0 4px;" />
                <span style="color: #666;">${issuedDate}</span>
              </div>
              
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <strong style="color: #333; min-width: 80px;">Issuer DID</strong>
                <img src="/static/arrow-right.png" alt="→" style="width: 12px; height: 12px; margin: 0 4px; margin-top: 2px;" />
                <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                  <span style="color: #0366d6; word-break: break-all; font-size: 15px;">${issuerDid}</span>
                  <img src="/static/copy.png" alt="Copy" style="width: 16px; height: 16px; cursor: pointer; opacity: 0.7; transition: opacity 0.2s;" onclick="copyToClipboard('${issuerDid}', this)" title="Copy DID" />
                </div>
              </div>
              
            </div>
            
            
            <!-- JSON Content (Hidden by default) -->
            <div class="json-content" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e1e4e8;">
              <pre style="background: #f6f8fa; padding: 12px; border-radius: 4px; overflow: auto; max-height: 600px; font-size: 12px; margin: 0;" id="json-content-${idx}">Loading raw credential data...</pre>
            </div>
            
            <!-- SVG Content (Hidden by default) -->
            <div class="svg-content" id="svg-content-${idx}" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e1e4e8;">
              <div style="position: relative;">
                <button onclick="closeCredentialSvg(${idx})" style="position: absolute; top: -10px; right: -10px; background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 50%; cursor: pointer; font-size: 12px; font-weight: bold; z-index: 10;">×</button>
                <div id="svg-display-${idx}" style="max-width: 100%; overflow: auto; text-align: center;">
                  <!-- SVG will be loaded here -->
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      gs1CredentialChain = `
        <div style="margin-top: 24px; width: 100%; max-width: 900px; margin-left: auto; margin-right: auto;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${chainContent}
          </div>
        </div>
      `;
      
      // Update SVG section to include credential chain SVG
      if (credentialChainSvg) {
        svgSection = `
          <div class="card">
            <div style="max-width: 100%; overflow: auto;">
              ${credentialChainSvg}
            </div>
          </div>
        `;
      }
      console.log('Created credential chain HTML:', gs1CredentialChain);
    } else {
      console.log('No credentialResults found or empty array');
      // Show message when no credentials are available
      gs1CredentialChain = `
        <div style="margin-top: 24px; width: 100%; max-width: 900px; margin-left: auto; margin-right: auto;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div class="card" style="border: 1px solid #e1e4e8; border-radius: 8px; padding: 16px; background: #fff; margin-bottom: 16px; width: 100%; text-align: center; color: #666;">
              <div style="font-size: 16px;">No credentials found in verification result</div>
              <div style="font-size: 14px; margin-top: 8px;">Credential chain will appear here when credentials are fetched during verification</div>
            </div>
          </div>
        </div>
      `;
    }

    const body = `${mainSection}${gs1Section}${credentialResultsSection}${credentialChainSection}${gs1CredentialChain}`;
    
    console.log('Final body HTML length:', body.length);
    console.log('Credential chain included:', gs1CredentialChain.length > 0 ? 'YES' : 'NO');
    
    // Add credential data to the page for client-side access
    const credentialDataScript = extractedCredentials.length > 0 ? 
      `<script>
        window.credentialData = ${JSON.stringify(extractedCredentials)};
        window.credentialRawData = ${JSON.stringify(extractedCredentials.map(cred => cred.rawPayload || cred))};
        console.log('Credential data injected:', window.credentialData);
        console.log('Credential raw data injected:', window.credentialRawData);
        console.log('Credential data length:', window.credentialData.length);
      </script>` : '';
    
    res.send(htmlPage(body, escapeHtml(jwtText), credentialDataScript));
  } catch (err) {
    res.status(500).send(htmlPage(`<p class="bad">Server error: ${String(err && err.message ? err.message : err)}</p>`));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GS1 VC/VP Verifier Web running at http://localhost:${PORT}`);
});