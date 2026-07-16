// Techarium course catalog — the only platform file a new course must register with.
// Runtime code stays inside the course package and is reached through launchUrl.
export const COURSES = Object.freeze([
  {
    id: 'byodc',
    slug: 'build-your-own-data-centre',
    title: 'Build Your Own Data Centre',
    displayTitle: 'Build your own <em>Data Centre.</em>',
    domain: 'hardware',
    domainLabel: 'Hardware · Computer systems',
    status: 'available',
    featured: true,
    level: 'Foundations',
    duration: '3–4 hours',
    moduleCount: 5,
    lessonCount: 21,
    launchUrl: 'course.html',
    description: 'Start with a silicon atom. Build a transistor, logic, a chip, a GPU, and finally the data centre that connects thousands of them.',
    outcomes: ['Semiconductor physics', 'Digital logic', 'Chip fabrication', 'GPU architecture', 'Data-centre systems'],
  },
  {
    id: 'distributed-systems',
    slug: 'build-a-distributed-system',
    title: 'Build a Distributed System',
    displayTitle: 'Build a <em>Distributed System.</em>',
    domain: 'systems',
    domainLabel: 'Systems · Networking',
    status: 'coming-soon',
    featured: false,
    level: 'Intermediate',
    duration: 'Coming soon',
    moduleCount: 5,
    lessonCount: 20,
    launchUrl: null,
    description: 'Turn one unreliable machine into a service that survives delay, duplication, partitions, and failure.',
    outcomes: ['Replication', 'Consensus', 'Sharding', 'Failure recovery'],
  },
  {
    id: 'neural-networks',
    slug: 'build-a-neural-network',
    title: 'Build a Neural Network',
    displayTitle: 'Build a <em>Neural Network.</em>',
    domain: 'ai',
    domainLabel: 'AI · Machine learning',
    status: 'available',
    featured: false,
    level: 'Foundations',
    duration: '2–3 hours',
    moduleCount: 4,
    lessonCount: 16,
    launchUrl: 'ai-course.html',
    description: 'Make a prediction, measure the error, move the weights, and watch learning emerge one operation at a time.',
    outcomes: ['Tensors', 'Forward pass', 'Backpropagation', 'Training'],
  },
  {
    id: 'zero-trust',
    slug: 'design-zero-trust-security',
    title: 'Design Zero-Trust Security',
    displayTitle: 'Design <em>Zero-Trust Security.</em>',
    domain: 'security',
    domainLabel: 'Security · Identity',
    status: 'coming-soon',
    featured: false,
    level: 'Intermediate',
    duration: 'Coming soon',
    moduleCount: 4,
    lessonCount: 15,
    launchUrl: null,
    description: 'Build identity, policy, segmentation, and verification into a network where location grants no automatic trust.',
    outcomes: ['Identity', 'Policy', 'Segmentation', 'Continuous verification'],
  },
]);

export function getCourse(courseId){
  return COURSES.find(course => course.id === courseId) || null;
}

export function getAvailableCourses(){
  return COURSES.filter(course => course.status === 'available');
}

export function getCourseLaunchUrl(course, progress){
  if (!course?.launchUrl) return null;
  if (!progress || progress.percent <= 0 || progress.completed) return course.launchUrl;
  const act = Math.max(1, Number(progress.lastAct) || 1);
  return `${course.launchUrl}?act=${act}&start=1`;
}
