export const createFlag = (flag, primary, secondary) => {
  const p = `fill: ${primary};`;
  const s = `fill: ${secondary};`;

  return flags[flag](p, s)
};

const flags = {
  1: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="30" style='${primary}'/> 
      <rect width="100" height="30" y="30" style='${secondary}'/> 
    </svg>
  `,

  2: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <rect width="100" height="20" y="20" style='${secondary}'/> 
    </svg>
  `,

  3: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <circle cx="50" cy="30" r="15" style='${secondary}'/>
    </svg>  
  `,

  4: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <rect width="50" height="30" x="50" style='${secondary}'/> 
      <rect width="50" height="30" y="30" style='${secondary}'/> 
    </svg>  
  `,

  5: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <polygon style='${secondary}' points="0,0 100,60, 0,60">
    </svg>  
  `,

  6: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <polygon style='${secondary}' points="0,0 30,30, 0,60">
    </svg>  
  `,

  7: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <polygon style='${secondary}' points="0,0 15,0 100,45 100,60, 85,60, 0,15">
    </svg>  
  `,

  8: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <rect width="50" height="60" x="50" style='${secondary}'/> 
      <polygon style='${secondary}' points="0,0 30,30, 0,60"/>
    </svg>  
  `,

  9: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <rect width="50" height="60" style='${secondary}'/> 
    </svg>  
  `,

  10: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <polygon style='${secondary}' points="0,0 30,30, 0,60"/>
      <polygon style='${secondary}' points="100,0 70,30 100,60"/> 
    </svg>  
  `,

  11: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <polygon style='${secondary}' points="0,0 15,0 100,45 100,60, 85,60, 0,15"/>
      <polygon style='${secondary}' points="100,0 85,0 0,45 0,60, 15,60, 100,15"/>
    </svg>  
  `,

  12: (primary, secondary) => `
    <svg viewBox="0 0 100 60">
      <rect width="100" height="60" style='${primary}'/> 
      <rect width="100" height="20" y="20" style='${secondary}'/> 
      <rect width="20" height="60" x="40" style='${secondary}'/> 
    </svg>  
  `
};
