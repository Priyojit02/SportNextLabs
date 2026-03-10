import * as XLSX from 'xlsx';
import { Player } from './types';

export interface ExcelRow {
  seed?: number;
  name?: string;
  Seed?: number;
  Name?: string;
  'Player Name'?: string;
  'Seed Number'?: number;
}

export function parseExcelFile(file: File): Promise<Player[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // xlsx library handles both Excel and CSV files
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
        
        const players: Player[] = [];
        
        for (const row of jsonData) {
          // Try to find seed and name from various column names (case-insensitive)
          const seed = row.seed || row.Seed || row['Seed Number'] || 0;
          const name = row.name || row.Name || row['Player Name'] || '';
          
          if (name && seed > 0) {
            players.push({
              id: generateId(),
              name: String(name).trim(),
              seed: Number(seed)
            });
          }
        }
        
        // Sort by seed
        players.sort((a, b) => a.seed - b.seed);
        
        resolve(players);
      } catch (error) {
        reject(new Error('Failed to parse file. Please ensure it has columns for Seed and Name.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Create a sample Excel file for download
export function createSampleExcel(): Blob {
  const sampleData = [
    { Seed: 1, Name: 'Player 1' },
    { Seed: 2, Name: 'Player 2' },
    { Seed: 3, Name: 'Player 3' },
    { Seed: 4, Name: 'Player 4' },
    { Seed: 5, Name: 'Player 5' },
    { Seed: 6, Name: 'Player 6' },
    { Seed: 7, Name: 'Player 7' },
    { Seed: 8, Name: 'Player 8' },
    { Seed: 9, Name: 'Player 9' },
    { Seed: 10, Name: 'Player 10' },
    { Seed: 11, Name: 'Player 11' },
    { Seed: 12, Name: 'Player 12' },
    { Seed: 13, Name: 'Player 13' },
    { Seed: 14, Name: 'Player 14' },
    { Seed: 15, Name: 'Player 15' },
    { Seed: 16, Name: 'Player 16' },
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Players');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
