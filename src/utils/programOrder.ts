export function sortProgramsByLocalStorage(programs: any[]): any[] {
    const storedOrder = localStorage.getItem("glift_program_order");
    if (!storedOrder) return programs;
  
    const order = JSON.parse(storedOrder);
    return programs.sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB);
    });
  }
  