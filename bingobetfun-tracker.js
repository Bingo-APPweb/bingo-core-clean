#!/usr/bin/env node

/**
 * BingoBetFun Development Tracker
 * 
 * A script to manage and track the development of BingoBetFun components,
 * providing structured logging, dependency tracking, and diagnostic reports.
 * 
 * Usage:
 *   node bingobetfun-tracker.js [command] [options]
 * 
 * Commands:
 *   status              Show status of all components
 *   log [component]     Log development action for a component
 *   diagnose            Generate diagnostic report
 *   dependencies        Show dependency graph
 *   milestone           Create or update milestone
 *   plan                Show development plan
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const CONFIG = {
  logDir: path.join(process.cwd(), 'bingobetfun-logs'),
  componentsDir: path.join(process.cwd(), 'components'),
  reportsDir: path.join(process.cwd(), 'reports'),
  components: [
    'BingoFlash',    // Overlay
    'BingoBackend',  // Backend
    'BingoCore',     // Admin
    'BingoBlitz',    // Mobile App
    'Appwrite',      // Appwrite Integration
    'SUPERLogs',     // Logging System
  ],
  phases: [
    'Planning',
    'Development',
    'Testing',
    'Deployment',
    'Maintenance'
  ],
  statusLevels: [
    'Not Started',
    'In Progress',
    'Blocked',
    'Review',
    'Completed'
  ],
  milestones: [
    'Overlay Integration',
    'Backend API',
    'Admin Dashboard',
    'Appwrite Migration',
    'Mobile WebView',
    'Smart TV Support',
    'ML Integration'
  ]
};

// Ensure directories exist
function ensureDirectoriesExist() {
  [CONFIG.logDir, CONFIG.componentsDir, CONFIG.reportsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Component dependency graph
const DEPENDENCIES = {
  'BingoFlash': ['BingoBackend'],
  'BingoBackend': ['Appwrite'],
  'BingoCore': ['Appwrite'],
  'BingoBlitz': ['BingoFlash', 'BingoBackend'],
  'Appwrite': [],
  'SUPERLogs': ['Appwrite']
};

// Component metadata and status tracking
class ComponentTracker {
  constructor() {
    // Ensure directories exist before trying to access files
    ensureDirectoriesExist();
    
    this.componentsFile = path.join(CONFIG.componentsDir, 'status.json');
    this.components = this.loadComponents();
  }

  loadComponents() {
    if (fs.existsSync(this.componentsFile)) {
      return JSON.parse(fs.readFileSync(this.componentsFile, 'utf8'));
    }
    
    // Initialize with default data
    const components = {};
    CONFIG.components.forEach(name => {
      components[name] = {
        name,
        status: 'Not Started',
        phase: 'Planning',
        lastUpdated: new Date().toISOString(),
        completionPercentage: 0,
        issues: [],
        notes: []
      };
    });
    this.saveComponents(components);
    return components;
  }

  saveComponents(components = this.components) {
    ensureDirectoriesExist(); // Make sure directory exists before writing
    fs.writeFileSync(this.componentsFile, JSON.stringify(components, null, 2));
    this.components = components;
  }

  updateComponent(name, updates) {
    if (!this.components[name]) {
      throw new Error(`Component ${name} not found`);
    }
    
    this.components[name] = {
      ...this.components[name],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    this.saveComponents();
    return this.components[name];
  }

  addNote(name, note) {
    if (!this.components[name]) {
      throw new Error(`Component ${name} not found`);
    }
    
    this.components[name].notes.push({
      timestamp: new Date().toISOString(),
      content: note
    });
    
    this.saveComponents();
  }

  addIssue(name, issue) {
    if (!this.components[name]) {
      throw new Error(`Component ${name} not found`);
    }
    
    this.components[name].issues.push({
      timestamp: new Date().toISOString(),
      content: issue,
      resolved: false
    });
    
    this.saveComponents();
  }

  resolveIssue(name, issueIndex) {
    if (!this.components[name]) {
      throw new Error(`Component ${name} not found`);
    }
    
    if (!this.components[name].issues[issueIndex]) {
      throw new Error(`Issue index ${issueIndex} not found`);
    }
    
    this.components[name].issues[issueIndex].resolved = true;
    this.components[name].issues[issueIndex].resolvedAt = new Date().toISOString();
    
    this.saveComponents();
  }

  getComponent(name) {
    return this.components[name];
  }

  getAllComponents() {
    return this.components;
  }

  getComponentDependencies(name) {
    return DEPENDENCIES[name] || [];
  }

  getComponentDependents(name) {
    return Object.entries(DEPENDENCIES)
      .filter(([_, deps]) => deps.includes(name))
      .map(([component]) => component);
  }

  checkDependencyStatus(name) {
    const dependencies = this.getComponentDependencies(name);
    const blockers = [];
    
    dependencies.forEach(dep => {
      const status = this.components[dep]?.status || 'Unknown';
      if (status !== 'Completed' && status !== 'Review') {
        blockers.push({ name: dep, status });
      }
    });
    
    return {
      ready: blockers.length === 0,
      blockers
    };
  }
}

// Development logging
class DevelopmentLogger {
  constructor() {
    // Ensure directory exists
    ensureDirectoriesExist();
    
    this.logFile = path.join(CONFIG.logDir, `development-${new Date().toISOString().split('T')[0]}.log`);
  }

  log(component, action, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      component,
      action,
      details
    };
    
    const logString = JSON.stringify(logEntry);
    fs.appendFileSync(this.logFile, logString + '\n');
    
    return logEntry;
  }

  getRecentLogs(component = null, limit = 20) {
    // Get all log files
    if (!fs.existsSync(CONFIG.logDir)) {
      ensureDirectoriesExist();
      return []; // Return empty array if directory was just created
    }
    
    const logFiles = fs.readdirSync(CONFIG.logDir)
      .filter(file => file.startsWith('development-'))
      .sort((a, b) => b.localeCompare(a)); // Sort descending
    
    const logs = [];
    
    for (const file of logFiles) {
      if (logs.length >= limit) break;
      
      const filePath = path.join(CONFIG.logDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      content.split('\n')
        .filter(line => line.trim())
        .forEach(line => {
          if (logs.length >= limit) return;
          
          try {
            const log = JSON.parse(line);
            if (!component || log.component === component) {
              logs.push(log);
            }
          } catch (e) {
            // Skip invalid lines
          }
        });
    }
    
    return logs;
  }
}

// Milestone tracking
class MilestoneTracker {
  constructor() {
    // Ensure directory exists
    ensureDirectoriesExist();
    
    this.milestonesFile = path.join(CONFIG.reportsDir, 'milestones.json');
    this.milestones = this.loadMilestones();
  }

  loadMilestones() {
    if (fs.existsSync(this.milestonesFile)) {
      return JSON.parse(fs.readFileSync(this.milestonesFile, 'utf8'));
    }
    
    // Initialize with default milestones
    const milestones = {};
    CONFIG.milestones.forEach(name => {
      milestones[name] = {
        name,
        status: 'Not Started',
        createdAt: new Date().toISOString(),
        targetDate: null,
        completedAt: null,
        components: [],
        notes: []
      };
    });
    
    // Add default component associations
    milestones['Overlay Integration'].components = ['BingoFlash'];
    milestones['Backend API'].components = ['BingoBackend'];
    milestones['Admin Dashboard'].components = ['BingoCore'];
    milestones['Appwrite Migration'].components = ['Appwrite', 'BingoBackend', 'BingoCore'];
    milestones['Mobile WebView'].components = ['BingoBlitz'];
    milestones['Smart TV Support'].components = ['BingoFlash'];
    milestones['ML Integration'].components = ['BingoCore', 'BingoFlash', 'BingoBackend'];
    
    this.saveMilestones(milestones);
    return milestones;
  }

  saveMilestones(milestones = this.milestones) {
    ensureDirectoriesExist(); // Make sure directory exists before writing
    fs.writeFileSync(this.milestonesFile, JSON.stringify(milestones, null, 2));
    this.milestones = milestones;
  }

  updateMilestone(name, updates) {
    if (!this.milestones[name]) {
      throw new Error(`Milestone ${name} not found`);
    }
    
    this.milestones[name] = {
      ...this.milestones[name],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    this.saveMilestones();
    return this.milestones[name];
  }

  addMilestone(name, components = [], targetDate = null) {
    if (this.milestones[name]) {
      throw new Error(`Milestone ${name} already exists`);
    }
    
    this.milestones[name] = {
      name,
      status: 'Not Started',
      createdAt: new Date().toISOString(),
      targetDate,
      completedAt: null,
      components,
      notes: []
    };
    
    this.saveMilestones();
    return this.milestones[name];
  }

  completeMilestone(name) {
    if (!this.milestones[name]) {
      throw new Error(`Milestone ${name} not found`);
    }
    
    this.milestones[name].status = 'Completed';
    this.milestones[name].completedAt = new Date().toISOString();
    
    this.saveMilestones();
  }

  getMilestone(name) {
    return this.milestones[name];
  }

  getAllMilestones() {
    return this.milestones;
  }

  getActiveMillestones() {
    return Object.values(this.milestones)
      .filter(m => m.status !== 'Completed');
  }

  calculateMilestoneProgress(name, componentTracker) {
    const milestone = this.milestones[name];
    if (!milestone) {
      throw new Error(`Milestone ${name} not found`);
    }
    
    const components = milestone.components;
    if (!components.length) return 0;
    
    let totalProgress = 0;
    components.forEach(comp => {
      const component = componentTracker.getComponent(comp);
      totalProgress += component ? component.completionPercentage : 0;
    });
    
    return Math.round(totalProgress / components.length);
  }
}

// Diagnostic reporter
class DiagnosticReporter {
  constructor(componentTracker, developmentLogger, milestoneTracker) {
    this.componentTracker = componentTracker;
    this.developmentLogger = developmentLogger;
    this.milestoneTracker = milestoneTracker;
  }

  generateDiagnosticReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      componentStatus: this.componentTracker.getAllComponents(),
      dependencies: this.analyzeDependencies(),
      issues: this.aggregateIssues(),
      milestones: this.milestoneTracker.getAllMilestones(),
      recentActivity: this.developmentLogger.getRecentLogs(null, 10)
    };
    
    // Ensure directory exists
    ensureDirectoriesExist();
    
    const reportPath = path.join(
      CONFIG.reportsDir, 
      `diagnostic-${new Date().toISOString().replace(/:/g, '_')}.json`
    );
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    return { report, path: reportPath };
  }

  generateSummary() {
    const components = this.componentTracker.getAllComponents();
    
    const statusCount = {};
    CONFIG.statusLevels.forEach(status => {
      statusCount[status] = 0;
    });
    
    Object.values(components).forEach(component => {
      statusCount[component.status] = (statusCount[component.status] || 0) + 1;
    });
    
    // Calculate overall progress
    const totalProgress = Object.values(components).reduce(
      (sum, comp) => sum + comp.completionPercentage, 
      0
    );
    const overallProgress = Math.round(totalProgress / Object.keys(components).length);
    
    // Get milestone statistics
    const milestones = this.milestoneTracker.getAllMilestones();
    const completedMilestones = Object.values(milestones)
      .filter(m => m.status === 'Completed')
      .length;
    
    return {
      componentCount: Object.keys(components).length,
      statusBreakdown: statusCount,
      overallProgress,
      completedMilestones,
      totalMilestones: Object.keys(milestones).length,
      blockers: this.findBlockers(),
      readyForProduction: overallProgress === 100
    };
  }

  analyzeDependencies() {
    const results = {};
    
    CONFIG.components.forEach(name => {
      const component = this.componentTracker.getComponent(name);
      const dependencies = this.componentTracker.getComponentDependencies(name);
      const dependents = this.componentTracker.getComponentDependents(name);
      const depStatus = this.componentTracker.checkDependencyStatus(name);
      
      results[name] = {
        status: component.status,
        progress: component.completionPercentage,
        dependencies,
        dependents,
        readyToProceed: depStatus.ready,
        blockers: depStatus.blockers
      };
    });
    
    return results;
  }

  findBlockers() {
    const blockers = [];
    
    CONFIG.components.forEach(name => {
      const component = this.componentTracker.getComponent(name);
      if (component.status === 'Blocked') {
        const issues = component.issues.filter(issue => !issue.resolved);
        blockers.push({
          component: name,
          issues: issues.map(i => i.content)
        });
      }
    });
    
    return blockers;
  }

  aggregateIssues() {
    const issues = {
      open: [],
      resolved: []
    };
    
    CONFIG.components.forEach(name => {
      const component = this.componentTracker.getComponent(name);
      
      component.issues.forEach(issue => {
        const formattedIssue = {
          component: name,
          timestamp: issue.timestamp,
          content: issue.content
        };
        
        if (issue.resolved) {
          formattedIssue.resolvedAt = issue.resolvedAt;
          issues.resolved.push(formattedIssue);
        } else {
          issues.open.push(formattedIssue);
        }
      });
    });
    
    return issues;
  }

  generateDependencyGraph() {
    // Generate a visual representation of the dependency graph
    // Returns a string with ASCII art or DOT format for Graphviz
    let dotGraph = 'digraph BingoBetFun {\n';
    dotGraph += '  rankdir=LR;\n';
    dotGraph += '  node [shape=box, style=filled, fillcolor=lightblue];\n';
    
    // Add nodes with progress info
    CONFIG.components.forEach(name => {
      const component = this.componentTracker.getComponent(name);
      const color = this.getProgressColor(component.completionPercentage);
      
      dotGraph += `  "${name}" [label="${name}\\n${component.completionPercentage}%", fillcolor="${color}"];\n`;
    });
    
    // Add edges
    CONFIG.components.forEach(name => {
      const dependencies = this.componentTracker.getComponentDependencies(name);
      
      dependencies.forEach(dep => {
        dotGraph += `  "${dep}" -> "${name}";\n`;
      });
    });
    
    dotGraph += '}\n';
    return dotGraph;
  }

  getProgressColor(percentage) {
    if (percentage < 25) return 'tomato';
    if (percentage < 50) return 'gold';
    if (percentage < 75) return 'lightblue';
    if (percentage < 100) return 'palegreen';
    return 'limegreen';
  }
}

// CLI Interface
class CLI {
  constructor() {
    // First ensure all directories exist
    ensureDirectoriesExist();
    
    this.componentTracker = new ComponentTracker();
    this.developmentLogger = new DevelopmentLogger();
    this.milestoneTracker = new MilestoneTracker();
    this.diagnosticReporter = new DiagnosticReporter(
      this.componentTracker,
      this.developmentLogger,
      this.milestoneTracker
    );
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  printHeader() {
    console.log('\n=========================================');
    console.log('    BINGOBETFUN DEVELOPMENT TRACKER');
    console.log('=========================================\n');
  }

  async prompt(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer);
      });
    });
  }

  async chooseFromList(message, options) {
    console.log(message);
    options.forEach((option, i) => {
      console.log(`${i + 1}. ${option}`);
    });
    
    const answer = await this.prompt('Enter number: ');
    const index = parseInt(answer, 10) - 1;
    
    if (index >= 0 && index < options.length) {
      return options[index];
    }
    
    console.log('Invalid selection. Please try again.');
    return this.chooseFromList(message, options);
  }

  async run(args) {
    // Ensure all directories exist at startup
    ensureDirectoriesExist();
    this.printHeader();
    
    const command = args[2] || await this.chooseFromList('Select a command:', [
      'status',
      'log',
      'diagnose',
      'dependencies',
      'milestone',
      'plan',
      'exit'
    ]);
    
    switch (command) {
      case 'status':
        await this.showStatus();
        break;
      case 'log':
        await this.logDevelopment(args[3]);
        break;
      case 'diagnose':
        await this.runDiagnostics();
        break;
      case 'dependencies':
        await this.showDependencies();
        break;
      case 'milestone':
        await this.manageMilestones();
        break;
      case 'plan':
        await this.showPlan();
        break;
      case 'exit':
        console.log('Exiting BingoBetFun Development Tracker.');
        this.rl.close();
        return;
      default:
        console.log(`Unknown command: ${command}`);
        break;
    }
    
    const again = await this.prompt('Run another command? (y/n): ');
    if (again.toLowerCase() === 'y') {
      await this.run([]);
    } else {
      this.rl.close();
    }
  }

  async showStatus() {
    console.log('\n=== Component Status ===\n');
    
    const components = this.componentTracker.getAllComponents();
    const table = [];
    
    // Add header
    table.push(['Component', 'Status', 'Phase', 'Progress', 'Last Updated']);
    
    // Add separator
    table.push(['---------', '------', '-----', '--------', '------------']);
    
    // Add component rows
    Object.values(components).forEach(component => {
      const lastUpdated = new Date(component.lastUpdated).toLocaleString();
      
      table.push([
        component.name,
        component.status,
        component.phase,
        `${component.completionPercentage}%`,
        lastUpdated
      ]);
    });
    
    // Calculate column widths
    const colWidths = table[0].map((_, i) => 
      Math.max(...table.map(row => row[i].toString().length))
    );
    
    // Print table
    table.forEach(row => {
      const formattedRow = row.map((cell, i) => 
        cell.toString().padEnd(colWidths[i] + 2)
      ).join('');
      
      console.log(formattedRow);
    });
    
    // Show issues summary
    const openIssues = this.diagnosticReporter.aggregateIssues().open;
    if (openIssues.length > 0) {
      console.log('\n=== Open Issues ===\n');
      openIssues.forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.component}] ${issue.content}`);
      });
    }
    
    console.log('\n');
  }

  async logDevelopment(componentName) {
    // Choose component if not provided
    let component = componentName;
    if (!component) {
      component = await this.chooseFromList(
        'Select component:',
        CONFIG.components
      );
    }
    
    const comp = this.componentTracker.getComponent(component);
    if (!comp) {
      console.log(`Component ${component} not found.`);
      return;
    }
    
    console.log(`\n=== Logging Development for ${component} ===\n`);
    console.log(`Current Status: ${comp.status}`);
    console.log(`Current Phase: ${comp.phase}`);
    console.log(`Progress: ${comp.completionPercentage}%`);
    
    // Choose action
    const action = await this.chooseFromList(
      'Select action:',
      [
        'Update Status',
        'Update Phase',
        'Update Progress',
        'Add Note',
        'Report Issue',
        'Resolve Issue',
        'Cancel'
      ]
    );
    
    if (action === 'Cancel') return;
    
    switch (action) {
      case 'Update Status': {
        const newStatus = await this.chooseFromList(
          'Select new status:',
          CONFIG.statusLevels
        );
        
        if (newStatus === 'In Progress') {
          // Check dependencies
          const depStatus = this.componentTracker.checkDependencyStatus(component);
          if (!depStatus.ready) {
            console.log('Warning: This component has unfinished dependencies:');
            depStatus.blockers.forEach(blocker => {
              console.log(`- ${blocker.name}: ${blocker.status}`);
            });
            
            const proceed = await this.prompt('Proceed anyway? (y/n): ');
            if (proceed.toLowerCase() !== 'y') return;
          }
        }
        
        const details = await this.prompt('Add details for this update: ');
        
        this.componentTracker.updateComponent(component, { status: newStatus });
        this.developmentLogger.log(component, `Status updated to ${newStatus}`, details);
        
        console.log(`Status updated to ${newStatus}.`);
        break;
      }
      
      case 'Update Phase': {
        const newPhase = await this.chooseFromList(
          'Select new phase:',
          CONFIG.phases
        );
        
        const details = await this.prompt('Add details for this update: ');
        
        this.componentTracker.updateComponent(component, { phase: newPhase });
        this.developmentLogger.log(component, `Phase updated to ${newPhase}`, details);
        
        console.log(`Phase updated to ${newPhase}.`);
        break;
      }
      
      case 'Update Progress': {
        const progressStr = await this.prompt('Enter new progress percentage (0-100): ');
        const progress = Math.min(100, Math.max(0, parseInt(progressStr, 10) || 0));
        
        const details = await this.prompt('Add details for this update: ');
        
        this.componentTracker.updateComponent(component, { completionPercentage: progress });
        this.developmentLogger.log(component, `Progress updated to ${progress}%`, details);
        
        console.log(`Progress updated to ${progress}%.`);
        
        // Check if component is complete
        if (progress === 100 && comp.status !== 'Completed') {
          const completeStatus = await this.prompt('Mark component as Completed? (y/n): ');
          if (completeStatus.toLowerCase() === 'y') {
            this.componentTracker.updateComponent(component, { status: 'Completed' });
            this.developmentLogger.log(component, 'Status updated to Completed', 'Automatically set based on 100% progress');
          }
        }
        
        break;
      }
      
      case 'Add Note': {
        const note = await this.prompt('Enter note: ');
        
        this.componentTracker.addNote(component, note);
        this.developmentLogger.log(component, 'Note added', note);
        
        console.log('Note added.');
        break;
      }
      
      case 'Report Issue': {
        const issue = await this.prompt('Describe the issue: ');
        
        this.componentTracker.addIssue(component, issue);
        this.developmentLogger.log(component, 'Issue reported', issue);
        
        // Ask if component should be marked as blocked
        const blockComponent = await this.prompt('Mark component as Blocked? (y/n): ');
        if (blockComponent.toLowerCase() === 'y') {
          this.componentTracker.updateComponent(component, { status: 'Blocked' });
          this.developmentLogger.log(component, 'Status updated to Blocked', `Due to issue: ${issue}`);
        }
        
        console.log('Issue reported.');
        break;
      }
      
      case 'Resolve Issue': {
        const issues = comp.issues.filter(issue => !issue.resolved);
        
        if (issues.length === 0) {
          console.log('No open issues to resolve.');
          return;
        }
        
        // List open issues
        console.log('Open issues:');
        issues.forEach((issue, i) => {
          console.log(`${i + 1}. ${issue.content}`);
        });
        
        // Select issue to resolve
        const issueIdxStr = await this.prompt('Enter issue number to resolve: ');
        const issueIdx = parseInt(issueIdxStr, 10) - 1;
        
        if (issueIdx >= 0 && issueIdx < issues.length) {
          const resolution = await this.prompt('Enter resolution details: ');
          
          // Find the actual index in the full issues array
          const actualIndex = comp.issues.findIndex(i => 
            i.content === issues[issueIdx].content && !i.resolved
          );
          
          this.componentTracker.resolveIssue(component, actualIndex);
          this.developmentLogger.log(
            component, 
            'Issue resolved', 
            `Issue: ${issues[issueIdx].content}. Resolution: ${resolution}`
          );
          
          console.log('Issue resolved.');
          
          // If component was blocked and this was the last issue, ask to unblock
          if (comp.status === 'Blocked' && comp.issues.every(i => i.resolved)) {
            const unblock = await this.prompt('Component is blocked. Set status to In Progress? (y/n): ');
            if (unblock.toLowerCase() === 'y') {
              this.componentTracker.updateComponent(component, { status: 'In Progress' });
              this.developmentLogger.log(
                component, 
                'Status updated to In Progress', 
                'All blocking issues resolved'
              );
            }
          }
        } else {
          console.log('Invalid issue number.');
        }
        
        break;
      }
    }
  }

  async runDiagnostics() {
    console.log('\n=== Generating Diagnostic Report ===\n');
    
    const { report, path } = this.diagnosticReporter.generateDiagnosticReport();
    
    console.log(`Report generated at: ${path}`);
    console.log('\n=== Summary ===\n');
    
    const summary = report.summary;
    console.log(`Overall Progress: ${summary.overallProgress}%`);
    console.log(`Components: ${summary.componentCount}`);
    console.log(`Milestones: ${summary.completedMilestones}/${summary.totalMilestones} completed`);
    
    console.log('\nStatus Breakdown:');
    Object.entries(summary.statusBreakdown).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`- ${status}: ${count}`);
      }
    });
    
    if (summary.blockers.length > 0) {
      console.log('\nBlockers:');
      summary.blockers.forEach(blocker => {
        console.log(`- ${blocker.component}:`);
        blocker.issues.forEach(issue => {
          console.log(`  * ${issue}`);
        });
      });
    }
    
    // Generate dependency graph
    const graphPath = path.join(CONFIG.reportsDir, 'dependency-graph.dot');
    const dotGraph = this.diagnosticReporter.generateDependencyGraph();
    fs.writeFileSync(graphPath, dotGraph);
    
    console.log(`\nDependency graph saved to: ${graphPath}`);
    console.log('To visualize, install Graphviz and run:');
    console.log(`dot -Tpng ${graphPath} -o ${graphPath.replace('.dot', '.png')}`);
    
    console.log('\nRun the following to view the diagnostic report in a browser:');
    console.log(`cat ${path} | json_pp | less`);
  }

  async showDependencies() {
    console.log('\n=== Component Dependencies ===\n');
    
    const dependencyAnalysis = this.diagnosticReporter.analyzeDependencies();
    
    CONFIG.components.forEach(name => {
      const analysis = dependencyAnalysis[name];
      
      console.log(`[${name}] - ${analysis.status} (${analysis.progress}%)`);
      
      if (analysis.dependencies.length > 0) {
        console.log('  Depends on:');
        analysis.dependencies.forEach(dep => {
          const depAnalysis = dependencyAnalysis[dep];
          console.log(`  - ${dep} (${depAnalysis.status}, ${depAnalysis.progress}%)`);
        });
      } else {
        console.log('  No dependencies');
      }
      
      if (analysis.dependents.length > 0) {
        console.log('  Required by:');
        analysis.dependents.forEach(dep => {
          const depAnalysis = dependencyAnalysis[dep];
          console.log(`  - ${dep} (${depAnalysis.status}, ${depAnalysis.progress}%)`);
        });
      } else {
        console.log('  Not required by any component');
      }
      
      console.log('  Ready to proceed:', analysis.readyToProceed ? 'Yes' : 'No');
      
      if (analysis.blockers.length > 0) {
        console.log('  Blockers:');
        analysis.blockers.forEach(blocker => {
          console.log(`  - ${blocker.name} (${blocker.status})`);
        });
      }
      
      console.log('');
    });
    
    // Generate and display ASCII dependency graph for quick view
    console.log('Dependency Graph:');
    this.printAsciiDependencyGraph();
  }

  printAsciiDependencyGraph() {
    const componentStatus = {};
    CONFIG.components.forEach(name => {
      const component = this.componentTracker.getComponent(name);
      componentStatus[name] = {
        status: component.status,
        progress: component.completionPercentage
      };
    });
    
    // Simple ASCII representation
    const processed = new Set();
    const renderLevel = (components, level = 0) => {
      components.forEach(name => {
        if (processed.has(name)) return;
        processed.add(name);
        
        const indent = '  '.repeat(level);
        const status = componentStatus[name];
        const statusEmoji = this.getStatusEmoji(status.status);
        
        console.log(`${indent}${statusEmoji} ${name} (${status.progress}%)`);
        
        // Render dependents
        const dependents = this.componentTracker.getComponentDependents(name);
        if (dependents.length > 0) {
          renderLevel(dependents, level + 1);
        }
      });
    };
    
    // Start with components that have no dependencies
    const rootComponents = CONFIG.components.filter(name => 
      this.componentTracker.getComponentDependencies(name).length === 0
    );
    
    renderLevel(rootComponents);
  }

  getStatusEmoji(status) {
    switch (status) {
      case 'Completed': return '✅';
      case 'In Progress': return '🔄';
      case 'Blocked': return '🚫';
      case 'Review': return '👀';
      case 'Not Started': return '⏳';
      default: return '❓';
    }
  }

  async manageMilestones() {
    console.log('\n=== Milestone Management ===\n');
    
    const action = await this.chooseFromList(
      'Select action:',
      [
        'View Milestones',
        'Create Milestone',
        'Update Milestone',
        'Complete Milestone',
        'Cancel'
      ]
    );
    
    if (action === 'Cancel') return;
    
    switch (action) {
      case 'View Milestones': {
        const milestones = this.milestoneTracker.getAllMilestones();
        
        console.log('\n=== All Milestones ===\n');
        
        Object.values(milestones).forEach(milestone => {
          const progress = this.milestoneTracker.calculateMilestoneProgress(
            milestone.name,
            this.componentTracker
          );
          
          const status = milestone.status === 'Completed' 
            ? 'Completed' 
            : `${progress}% complete`;
          
          console.log(`[${milestone.name}] - ${status}`);
          
          if (milestone.targetDate) {
            console.log(`  Target: ${new Date(milestone.targetDate).toLocaleDateString()}`);
          }
          
          if (milestone.components.length > 0) {
            console.log('  Components:');
            milestone.components.forEach(comp => {
              const component = this.componentTracker.getComponent(comp);
              console.log(`  - ${comp} (${component.status}, ${component.completionPercentage}%)`);
            });
          }
          
          console.log('');
        });
        
        break;
      }
      
      case 'Create Milestone': {
        const name = await this.prompt('Enter milestone name: ');
        
        if (!name) {
          console.log('Milestone name cannot be empty.');
          return;
        }
        
        if (this.milestoneTracker.getMilestone(name)) {
          console.log(`Milestone "${name}" already exists.`);
          return;
        }
        
        // Select components for the milestone
        const selectedComponents = [];
        let selecting = true;
        
        console.log('\nSelect components for this milestone:');
        console.log('(Enter component numbers, empty line when done)');
        
        CONFIG.components.forEach((comp, i) => {
          console.log(`${i + 1}. ${comp}`);
        });
        
        while (selecting) {
          const selection = await this.prompt('Component #: ');
          
          if (!selection) {
            selecting = false;
            continue;
          }
          
          const index = parseInt(selection, 10) - 1;
          if (index >= 0 && index < CONFIG.components.length) {
            const component = CONFIG.components[index];
            
            if (!selectedComponents.includes(component)) {
              selectedComponents.push(component);
              console.log(`Added ${component}`);
            } else {
              console.log(`${component} already added.`);
            }
          } else {
            console.log('Invalid component number.');
          }
        }
        
        // Get target date (optional)
        const targetDateStr = await this.prompt('Enter target date (YYYY-MM-DD, or empty for none): ');
        let targetDate = null;
        
        if (targetDateStr) {
          targetDate = new Date(targetDateStr);
          
          if (isNaN(targetDate.getTime())) {
            console.log('Invalid date format. Using no target date.');
            targetDate = null;
          }
        }
        
        // Create the milestone
        this.milestoneTracker.addMilestone(name, selectedComponents, targetDate);
        
        console.log(`Milestone "${name}" created.`);
        break;
      }
      
      case 'Update Milestone': {
        const milestones = Object.keys(this.milestoneTracker.getAllMilestones());
        
        if (milestones.length === 0) {
          console.log('No milestones found.');
          return;
        }
        
        const milestoneName = await this.chooseFromList(
          'Select milestone to update:',
          milestones
        );
        
        const milestone = this.milestoneTracker.getMilestone(milestoneName);
        
        if (!milestone) {
          console.log(`Milestone "${milestoneName}" not found.`);
          return;
        }
        
        const updateField = await this.chooseFromList(
          'Select field to update:',
          [
            'Target Date',
            'Components',
            'Status',
            'Add Note',
            'Cancel'
          ]
        );
        
        if (updateField === 'Cancel') return;
        
        switch (updateField) {
          case 'Target Date': {
            const currentTarget = milestone.targetDate 
              ? new Date(milestone.targetDate).toLocaleDateString() 
              : 'None';
            
            console.log(`Current target date: ${currentTarget}`);
            
            const newDateStr = await this.prompt('Enter new target date (YYYY-MM-DD, or "none"): ');
            
            if (newDateStr.toLowerCase() === 'none') {
              this.milestoneTracker.updateMilestone(milestoneName, { targetDate: null });
              console.log('Target date removed.');
            } else {
              const newDate = new Date(newDateStr);
              
              if (isNaN(newDate.getTime())) {
                console.log('Invalid date format. No changes made.');
                return;
              }
              
              this.milestoneTracker.updateMilestone(milestoneName, { targetDate: newDate.toISOString() });
              console.log(`Target date updated to ${newDate.toLocaleDateString()}.`);
            }
            
            break;
          }
          
          case 'Components': {
            const currentComponents = milestone.components;
            console.log('Current components:', currentComponents.join(', ') || 'None');
            
            const action = await this.chooseFromList(
              'Select action:',
              [
                'Add Component',
                'Remove Component',
                'Replace All Components',
                'Cancel'
              ]
            );
            
            if (action === 'Cancel') return;
            
            switch (action) {
              case 'Add Component': {
                const availableComponents = CONFIG.components.filter(
                  c => !currentComponents.includes(c)
                );
                
                if (availableComponents.length === 0) {
                  console.log('All components are already included in this milestone.');
                  return;
                }
                
                const component = await this.chooseFromList(
                  'Select component to add:',
                  availableComponents
                );
                
                this.milestoneTracker.updateMilestone(
                  milestoneName, 
                  { components: [...currentComponents, component] }
                );
                
                console.log(`Component "${component}" added to milestone.`);
                break;
              }
              
              case 'Remove Component': {
                if (currentComponents.length === 0) {
                  console.log('No components to remove.');
                  return;
                }
                
                const component = await this.chooseFromList(
                  'Select component to remove:',
                  currentComponents
                );
                
                this.milestoneTracker.updateMilestone(
                  milestoneName, 
                  { 
                    components: currentComponents.filter(c => c !== component) 
                  }
                );
                
                console.log(`Component "${component}" removed from milestone.`);
                break;
              }
              
              case 'Replace All Components': {
                const selectedComponents = [];
                let selecting = true;
                
                console.log('\nSelect components for this milestone:');
                console.log('(Enter component numbers, empty line when done)');
                
                CONFIG.components.forEach((comp, i) => {
                  console.log(`${i + 1}. ${comp}`);
                });
                
                while (selecting) {
                  const selection = await this.prompt('Component #: ');
                  
                  if (!selection) {
                    selecting = false;
                    continue;
                  }
                  
                  const index = parseInt(selection, 10) - 1;
                  if (index >= 0 && index < CONFIG.components.length) {
                    const component = CONFIG.components[index];
                    
                    if (!selectedComponents.includes(component)) {
                      selectedComponents.push(component);
                      console.log(`Added ${component}`);
                    } else {
                      console.log(`${component} already added.`);
                    }
                  } else {
                    console.log('Invalid component number.');
                  }
                }
                
                this.milestoneTracker.updateMilestone(
                  milestoneName, 
                  { components: selectedComponents }
                );
                
                console.log('Components updated.');
                break;
              }
            }
            
            break;
          }
          
          case 'Status': {
            const currentStatus = milestone.status;
            console.log(`Current status: ${currentStatus}`);
            
            const newStatus = await this.chooseFromList(
              'Select new status:',
              [
                'Not Started',
                'In Progress',
                'Delayed',
                'Completed',
                'Cancelled'
              ]
            );
            
            // If marking as completed, ask for confirmation
            if (newStatus === 'Completed') {
              const progress = this.milestoneTracker.calculateMilestoneProgress(
                milestoneName,
                this.componentTracker
              );
              
              if (progress < 100) {
                console.log(`Warning: Milestone is only ${progress}% complete.`);
                const confirm = await this.prompt('Mark as completed anyway? (y/n): ');
                
                if (confirm.toLowerCase() !== 'y') {
                  console.log('No changes made.');
                  return;
                }
              }
              
              // Set completion date
              this.milestoneTracker.completeMilestone(milestoneName);
              console.log(`Milestone "${milestoneName}" marked as Completed.`);
            } else {
              this.milestoneTracker.updateMilestone(milestoneName, { status: newStatus });
              console.log(`Status updated to ${newStatus}.`);
            }
            
            break;
          }
          
          case 'Add Note': {
            const note = await this.prompt('Enter note: ');
            
            if (!note) {
              console.log('No note entered. No changes made.');
              return;
            }
            
            const milestone = this.milestoneTracker.getMilestone(milestoneName);
            const notes = milestone.notes || [];
            
            this.milestoneTracker.updateMilestone(
              milestoneName, 
              { 
                notes: [
                  ...notes, 
                  { timestamp: new Date().toISOString(), content: note }
                ]
              }
            );
            
            console.log('Note added.');
            break;
          }
        }
        
        break;
      }
      
      case 'Complete Milestone': {
        const incompleteMilestones = Object.values(this.milestoneTracker.getAllMilestones())
          .filter(m => m.status !== 'Completed')
          .map(m => m.name);
        
        if (incompleteMilestones.length === 0) {
          console.log('No incomplete milestones found.');
          return;
        }
        
        const milestoneName = await this.chooseFromList(
          'Select milestone to complete:',
          incompleteMilestones
        );
        
        const progress = this.milestoneTracker.calculateMilestoneProgress(
          milestoneName,
          this.componentTracker
        );
        
        console.log(`Current progress: ${progress}%`);
        
        if (progress < 100) {
          console.log('Warning: Not all components are at 100% completion.');
          const confirm = await this.prompt('Complete milestone anyway? (y/n): ');
          
          if (confirm.toLowerCase() !== 'y') {
            console.log('No changes made.');
            return;
          }
        }
        
        this.milestoneTracker.completeMilestone(milestoneName);
        console.log(`Milestone "${milestoneName}" completed.`);
        
        break;
      }
    }
  }

  async showPlan() {
    console.log('\n=== Development Plan ===\n');
    
    // Get all components and milestones
    const components = this.componentTracker.getAllComponents();
    const milestones = this.milestoneTracker.getAllMilestones();
    
    // Sort milestones by target date
    const sortedMilestones = Object.values(milestones)
      .filter(m => m.targetDate)
      .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
    
    // Group by status
    console.log('=== CURRENT STATUS ===\n');
    
    const statusGroups = {};
    CONFIG.statusLevels.forEach(status => {
      statusGroups[status] = [];
    });
    
    Object.values(components).forEach(component => {
      statusGroups[component.status].push(component);
    });
    
    Object.entries(statusGroups).forEach(([status, comps]) => {
      if (comps.length > 0) {
        console.log(`${status}:`);
        comps.forEach(comp => {
          console.log(`- ${comp.name} (${comp.completionPercentage}%)`);
        });
        console.log('');
      }
    });
    
    // Show upcoming milestones
    console.log('=== UPCOMING MILESTONES ===\n');
    
    const now = new Date();
    const upcomingMilestones = sortedMilestones.filter(
      m => m.status !== 'Completed' && new Date(m.targetDate) > now
    );
    
    if (upcomingMilestones.length === 0) {
      console.log('No upcoming milestones with target dates.\n');
    } else {
      upcomingMilestones.forEach(milestone => {
        const targetDate = new Date(milestone.targetDate).toLocaleDateString();
        const progress = this.milestoneTracker.calculateMilestoneProgress(
          milestone.name,
          this.componentTracker
        );
        
        console.log(`[${targetDate}] ${milestone.name} (${progress}% complete)`);
        
        // Show component status for this milestone
        if (milestone.components.length > 0) {
          console.log('  Components:');
          milestone.components.forEach(compName => {
            const comp = this.componentTracker.getComponent(compName);
            console.log(`  - ${compName} (${comp.status}, ${comp.completionPercentage}%)`);
          });
        }
        
        console.log('');
      });
    }
    
    // Show critical path
    console.log('=== CRITICAL PATH ===\n');
    
    const criticalPath = this.calculateCriticalPath();
    
    if (criticalPath.length === 0) {
      console.log('No dependencies found in project.\n');
    } else {
      console.log('The following components are on the critical path:');
      
      criticalPath.forEach((component, i) => {
        const comp = this.componentTracker.getComponent(component);
        const arrow = i < criticalPath.length - 1 ? ' ↓ ' : '';
        console.log(`${comp.name} (${comp.status}, ${comp.completionPercentage}%)${arrow}`);
      });
      
      console.log('');
    }
    
    // Show recommendations
    console.log('=== RECOMMENDATIONS ===\n');
    
    const blockers = this.diagnosticReporter.findBlockers();
    const dependencies = this.diagnosticReporter.analyzeDependencies();
    
    // 1. Unblock components
    if (blockers.length > 0) {
      console.log('1. Resolve blockers:');
      blockers.forEach(blocker => {
        console.log(`- Unblock ${blocker.component}:`);
        blocker.issues.forEach(issue => {
          console.log(`  * ${issue}`);
        });
      });
      console.log('');
    }
    
    // 2. Work on components that are ready to proceed
    const readyComponents = CONFIG.components
      .filter(name => {
        const comp = this.componentTracker.getComponent(name);
        const deps = dependencies[name];
        return comp.status !== 'Completed' && 
               comp.status !== 'Blocked' && 
               deps.readyToProceed;
      })
      .sort((a, b) => {
        // Prioritize components on the critical path
        const aOnPath = criticalPath.includes(a);
        const bOnPath = criticalPath.includes(b);
        
        if (aOnPath && !bOnPath) return -1;
        if (!aOnPath && bOnPath) return 1;
        
        // Then prioritize components with higher progress
        const compA = this.componentTracker.getComponent(a);
        const compB = this.componentTracker.getComponent(b);
        
        return compB.completionPercentage - compA.completionPercentage;
      });
    
    if (readyComponents.length > 0) {
      console.log('2. Focus on these components next:');
      readyComponents.forEach(name => {
        const comp = this.componentTracker.getComponent(name);
        const criticalTag = criticalPath.includes(name) ? ' [CRITICAL]' : '';
        console.log(`- ${name} (${comp.status}, ${comp.completionPercentage}%)${criticalTag}`);
      });
      console.log('');
    }
    
    // 3. Upcoming milestone recommendations
    if (upcomingMilestones.length > 0) {
      const nextMilestone = upcomingMilestones[0];
      const progress = this.milestoneTracker.calculateMilestoneProgress(
        nextMilestone.name,
        this.componentTracker
      );
      
      console.log(`3. Focus on completing the "${nextMilestone.name}" milestone (${progress}% complete):`);
      
      // Find components that need work for this milestone
      const incompleteComponents = nextMilestone.components
        .filter(name => {
          const comp = this.componentTracker.getComponent(name);
          return comp.status !== 'Completed';
        })
        .sort((a, b) => {
          const compA = this.componentTracker.getComponent(a);
          const compB = this.componentTracker.getComponent(b);
          
          return compB.completionPercentage - compA.completionPercentage;
        });
      
      incompleteComponents.forEach(name => {
        const comp = this.componentTracker.getComponent(name);
        console.log(`- ${name} (${comp.status}, ${comp.completionPercentage}%)`);
      });
      
      console.log('');
    }
  }

  calculateCriticalPath() {
    // Simple critical path calculation based on dependencies
    // This could be improved with more sophisticated algorithms
    
    // Find all leaf components (no dependents)
    const leafComponents = CONFIG.components.filter(name => 
      this.componentTracker.getComponentDependents(name).length === 0
    );
    
    // Find the leaf component with the lowest progress
    const criticalLeaf = leafComponents.reduce((critical, current) => {
      const criticalComp = this.componentTracker.getComponent(critical);
      const currentComp = this.componentTracker.getComponent(current);
      
      return currentComp.completionPercentage < criticalComp.completionPercentage
        ? current
        : critical;
    }, leafComponents[0]);
    
    // Build path backwards from critical leaf
    const path = [criticalLeaf];
    let current = criticalLeaf;
    
    while (true) {
      const dependencies = this.componentTracker.getComponentDependencies(current);
      
      if (dependencies.length === 0) break;
      
      // Find the dependency with the lowest progress
      const criticalDep = dependencies.reduce((critical, current) => {
        const criticalComp = this.componentTracker.getComponent(critical);
        const currentComp = this.componentTracker.getComponent(current);
        
        return currentComp.completionPercentage < criticalComp.completionPercentage
          ? current
          : critical;
      }, dependencies[0]);
      
      path.unshift(criticalDep);
      current = criticalDep;
    }
    
    return path;
  }
}

// Main
// Create required directories before anything else
ensureDirectoriesExist();

// Start the CLI
const cli = new CLI();
cli.run(process.argv);