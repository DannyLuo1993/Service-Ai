
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Database, Loader2, FileText, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateEmbedding, storeEmbeddingsInDatabase } from '@/services/embeddingService';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  timestamp: Date;
  fileCount: number;
}

interface EmbeddingDatasetManagerProps {
  onSelectDataset: (datasetId: string | null) => void;
  selectedDatasetId: string | null;
}

const EmbeddingDatasetManager = ({ onSelectDataset, selectedDatasetId }: EmbeddingDatasetManagerProps) => {
  const [datasets, setDatasets] = useState<Dataset[]>([
    {
      id: 'default',
      name: '1',  // 修改为文件名
      description: '恒盛桌面条码打印机知识库',  // 修改描述
      timestamp: new Date(),
      fileCount: 1
    }
  ]);
  
  const [uploading, setUploading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleCreateDataset = () => {
    if (!newDatasetName.trim()) {
      toast({
        variant: "destructive",
        title: "Dataset name required",
        description: "Please provide a name for your dataset"
      });
      return;
    }
    
    const newDataset: Dataset = {
      id: crypto.randomUUID(),
      name: newDatasetName,
      description: newDatasetDescription,
      timestamp: new Date(),
      fileCount: 0
    };
    
    setDatasets(prev => [...prev, newDataset]);
    setNewDatasetName('');
    setNewDatasetDescription('');
    setShowCreateForm(false);
    
    toast({
      title: "Dataset created",
      description: `Dataset "${newDatasetName}" has been created`
    });
    
    // Auto-select the new dataset
    onSelectDataset(newDataset.id);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedDatasetId) {
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        
        // Update progress
        setUploadProgress(Math.floor((i / files.length) * 100));
        
        // Generate embeddings and store them in the dataset
        try {
          await storeEmbeddingsInDatabase(text, selectedDatasetId);
          console.log(`Generated embedding for file: ${file.name}`);
        } catch (error) {
          console.error('Error generating embedding:', error);
          throw new Error(`Failed to generate embedding for ${file.name}`);
        }
      }
      
      // Update the dataset fileCount
      setDatasets(prev => prev.map(ds => 
        ds.id === selectedDatasetId 
          ? { ...ds, fileCount: ds.fileCount + files.length } 
          : ds
      ));
      
      toast({
        title: "Files processed",
        description: `${files.length} file(s) have been processed and added to the dataset`
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process files"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const loadLocalFiles = async () => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // 使用相对路径从 public 目录加载文件
      const localFiles = [
        '/dbfiles/知识库测试.json'
      ];
      
      for (let i = 0; i < localFiles.length; i++) {
        try {
          // 直接从 public 目录获取文件
          const response = await fetch(localFiles[i]);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const text = await response.text();
          
          // 获取文件名（去掉路径和扩展名）
          const fileName = localFiles[i].split('/').pop()?.replace('.json', '') || '无法解析知识库';
          
          // 更新数据集名称
          setDatasets(prev => prev.map(ds => 
            ds.id === 'default'
              ? { ...ds, name: fileName }
              : ds
          ));
          
          setUploadProgress(Math.floor((i / localFiles.length) * 100));
          await storeEmbeddingsInDatabase(text, 'default');
          console.log(`Generated embedding for file: ${fileName}`);
          
        } catch (error) {
          console.error(`Error processing file ${localFiles[i]}:`, error);
        }
      }
      
      setDatasets(prev => prev.map(ds => 
        ds.id === 'default'
          ? { ...ds, fileCount: localFiles.length }
          : ds
      ));
      
    } catch (error) {
      console.error('Error loading local files:', error);
      toast({
        variant: "destructive",
        title: "Failed to load knowledge base",
        description: "Error loading local knowledge base files"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 组件加载时自动读取文件
  useEffect(() => {
    loadLocalFiles();
  }, []);

  // 移除文件上传相关的 UI 元素
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-5 w-5" />
          Knowledge Base
        </CardTitle>
        <CardDescription>
          System knowledge base for printer support
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dataset-select">Select Knowledge Base</Label>
            <Select 
              value={selectedDatasetId || 'none'} 
              onValueChange={(value) => onSelectDataset(value === 'none' ? null : value)}
            >
              <SelectTrigger id="dataset-select" className="w-full">
                <SelectValue placeholder="Select a dataset" />
              </SelectTrigger>
              <SelectContent>
                {datasets.map(dataset => (
                  <SelectItem key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.fileCount} file{dataset.fileCount !== 1 ? 's' : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedDatasetId && (
            <div className="border rounded-md p-4 bg-secondary/20">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">
                  {datasets.find(d => d.id === selectedDatasetId)?.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {datasets.find(d => d.id === selectedDatasetId)?.fileCount} file(s)
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {datasets.find(d => d.id === selectedDatasetId)?.description || 'No description'}
              </p>
              
              {uploading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading knowledge base ({uploadProgress}%)
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmbeddingDatasetManager;
