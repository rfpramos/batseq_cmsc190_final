import subprocess
import sys
import os


INPUT_FASTA = "rna_sequences.fasta"    
ALIGNED_FASTA = "aligned.fasta"      
NEWICK_FILE = "tree.newick"            


if not os.path.exists(INPUT_FASTA):
    print(f" ERROR: Input FASTA file '{INPUT_FASTA}' not found.")
    sys.exit(1)



print("Running MUSCLE for MSA...")
muscle_cmd = ["muscle", "-in", INPUT_FASTA, "-out", ALIGNED_FASTA]

muscle_run = subprocess.run(muscle_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

if muscle_run.returncode != 0:
    print(" MUSCLE failed:")
    print(muscle_run.stderr.decode())
    sys.exit(1)

print(f"Alignment complete → {ALIGNED_FASTA}")


print("Building phylogenetic tree using FastTree...")
with open(NEWICK_FILE, "w") as outfile:
    ft_cmd = ["FastTree", "-nt", ALIGNED_FASTA]
    ft_run = subprocess.run(ft_cmd, stdout=outfile, stderr=subprocess.PIPE)

if ft_run.returncode != 0:
    print("❌ FastTree failed:")
    print(ft_run.stderr.decode())
    sys.exit(1)

print(f"Newick tree generated → {NEWICK_FILE}")

print("\n NEWICK TREE OUTPUT:")
with open(NEWICK_FILE) as f:
    print(f.read())
