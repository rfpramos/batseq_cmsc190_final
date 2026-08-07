/**
 * Dashboard.js
 * 
 * This is the main dashboard component for the BatSEQ.
 * It displays a list of bacterial isolates derived from bat fecal pellets,
 * allowing users to view, add, edit, delete, and share isolate information.
 * It also integrates sequence visualization using SeqViz.
 * 
 * THIS CONTAINS THE BRUNT OF THE CODE.
 * 
 * Legacy Codes are commented out and marked as @deprecated, but are still present in the codebase for reference and potential future use.
 *
 * Editted by Ramnick Francis P. Ramos
 * 10/02/2026 4:30PM
 * 
 **/


import React, { useState, useEffect } from "react";
import { SeqViz } from "seqviz"; // The dashboard will contain the SeqViz component for sequence visualization



import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";

import axios from "axios";

import SendIcon from "@mui/icons-material/Send";

import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/system";
import ImageIcon from "@mui/icons-material/Image";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";



import { gray } from "../getLPTheme";

import InfoIcon from "@mui/icons-material/Info";
import ShareIcon from "@mui/icons-material/Share";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import DeleteIcon from "@mui/icons-material/Delete"; // Corrected import path

export default function Dashboard() {
  const [dataset, setDataset] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);

  // New isolate state
  //Contains all the fields needed to add a new isolate, including the gene sequence and image URL.
  const [newIsolate, setNewIsolate] = useState({
    isolate_code: "",
    type_of_sample: "",
    bat_source: "",
    sampling_site: "",
    gram_reaction: "",
    cell_shape: "",
    oxygen_requirement: "",
    presence_of_cytochrome_c_oxidase: "",
    endospore_forming_capability: "",
    antibiotic_resitance_profile: "",
    identity: "",
    pathogenicity: "",
    gene_seq: "", // This field will hold the gene sequence extracted from the uploaded FASTA file.
    image_url: "", //Connected to cloudinary
  });

  const [fileName, setFileName] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [open, setOpen] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedIsolate, setSelectedIsolate] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [editIsolate, setEditIsolate] = useState(null);

  const [openShare, setOpenShare] = useState(false);

  const [sharedData, setSharedData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/data")
      .then((response) => {
        setDataset(response.data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const fetchSharedData = async (email) => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/data/shared",
        {
          params: {
            email: email,
          },
        }
      );
      // console.log('Shared data:', response.data);
      setSharedData(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching shared data:", error);
      throw error;
    }
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    fetchSharedData(email);
  }, []); // Adjust the dependency array as needed

  const nucleotideStyles = {
    A: { color: "green" },
    T: { color: "red" },
    C: { color: "blue" },
    G: { color: "#9B870C" },
  };

  // Function to wrap each nucleotide in a span with a style
  function colorCodeSequence(sequence) {
    return sequence.split("").map((nucleotide, index) => (
      <span key={index} style={nucleotideStyles[nucleotide] || {}}>
        {nucleotide}
      </span>
    ));
  }

  const handleClickOpen = (isolate) => {
    setSelectedIsolate(isolate);
    setOpen(true);
  };

  const [isolateCodeToShare, setIsolateCodeToShare] = useState(null);

  const handleClickOpenShare = (isolate_code) => {
    setIsolateCodeToShare(isolate_code);
    setOpenShare(true);
  };

  const handleCloseShare = () => {
    setOpenShare(false);
    setIsolateCodeToShare(null);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedIsolate(null);
  };

  const handleClickOpenDetails = (isolate) => {
    setSelectedIsolate(isolate);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setSelectedIsolate(null);
  };

  const handleAddOpen = () => {
    setOpenAdd(true);
  };

  const handleAddClose = () => {
    setOpenAdd(false);
    setFileName("");
    setImageFileName("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setNewIsolate({ ...newIsolate, [name]: value });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split("\n");
        const sequenceLines = lines.filter((line) => !line.startsWith(">"));
        const sequence = sequenceLines.join("").trim();
        setNewIsolate({ ...newIsolate, gene_seq: sequence });
      };
      reader.readAsText(file);
      setFileName(file.name);
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");

      try {
        // console.log(
        //   "Uploading image...",
        //   formData.get("file"),
        //   formData.get("upload_preset")
        // );
        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/dpuozwh3r/image/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        setNewIsolate({ ...newIsolate, image_url: response.data.secure_url });
        setImageFileName(file.name);
      } catch (error) {
        console.error(
          "Error uploading image:",
          error.response ? error.response.data : error.message
        );
      }
    }
  };

  const handleAddSubmit = () => {
    axios
      .post("http://localhost:5000/api/data", newIsolate)
      .then((response) => {
        setDataset([...dataset, response.data]);

        handleAddClose();
      })
      .catch((error) => console.error("Error adding data:", error));

    const isolate_code = newIsolate.isolate_code;
    const email = localStorage.getItem("email");
    const newShareTo = { email: email, isolate_code: isolate_code };
    // console.log("newShareTo:", newShareTo);
    axios
      .post("http://localhost:5000/api/data/shareto", newShareTo)
      .catch((error) => {
        if (error.response) {
          console.error("Error response:", error.response);
        } else if (error.request) {
          console.error("No response received:", error.request);
        } else {
          console.error("Error:", error.message);
        }
      });
  };

  const handleDelete = (isolate_code) => {
    axios
      .delete(`http://localhost:5000/api/data/${isolate_code}`)
      .then((response) => {
        const updatedDataset = dataset.filter(
          (item) => item.isolate_code !== isolate_code
        );
        setDataset(updatedDataset);
      })
      .catch((error) => console.error("Error deleting data:", error));
  };

  const handleClickOpenEdit = (isolate) => {
    setEditIsolate({ ...isolate });
    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditIsolate(null);
  };

  const handleChangeEdit = (event) => {
    const { name, value } = event.target;
    setEditIsolate({ ...editIsolate, [name]: value });
  };

  const handleEditSubmit = () => {
    axios
      .put(
        `http://localhost:5000/api/data/${editIsolate.isolate_code}`,
        editIsolate
      )
      .then((response) => {
        const updatedDataset = dataset.map((item) =>
          item.isolate_code === response.data.isolate_code
            ? response.data
            : item
        );
        setDataset(updatedDataset);
        handleCloseEdit();
      })
      .catch((error) => console.error("Error updating data:", error));
  };

  const theme = useTheme();
  // const logos = theme.palette.mode === "light" ? darkLogos : whiteLogos;

  function sampleAccessVerifier(sample_isolate_code) {
    if (!sharedData) {
      return false;
    }

    if (localStorage.getItem("isAdmin") === "true") {
      return true;
    }

    // console.log("sample_isolate_code", sample_isolate_code);
    // console.log("sharedData", sharedData);
    let isInSharedData = sharedData.some(
      (item) => item.isolate_code == sample_isolate_code
    );

    if (isInSharedData) {
      // console.log("returned true");
      return true;
    } else {
      // console.log("returned false");
      return false;
    }
  }
  const [isDatasetChanged, setIsDatasetChanged] = useState(false);
  const [emailAddressRecepient, setEmailAddressRecepient] = useState("");

  const handleSending = (isolate_code_to_share) => {
    // console.log(isolate_code_to_share); // Use the state value as needed
    // console.log(emailAddressRecepient); // Use the state value as needed

    
    const newShareTo = {
      email: emailAddressRecepient,
      isolate_code: isolate_code_to_share,
    };

    axios
      .post("http://localhost:5000/api/data/shareto", newShareTo)
      .catch((error) => {
        if (error.response) {
          console.error("Error response:", error.response);
        } else if (error.request) {
          console.error("No response received:", error.request);
        } else {
          console.error("Error:", error.message);
        }
      });

    handleCloseShare();
  };

  // Step 2: Set state on change
  const handleEmailChange = (event) => {
    setEmailAddressRecepient(event.target.value);
  };

  // @deprecated 
  
  // Assuming `sharedDataset` is a prop, watch for its changes
  useEffect(() => {
    // Logic to determine if sharedDataset has changed
    // This is a placeholder, actual implementation may vary based on how changes are detected
    setIsDatasetChanged(true); // Set to true if changed
  }, [sharedData]); // Dependency array, re-run effect if sharedDataset changes

  return (
    <Container
      id="dashboard"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: { xs: 3, sm: 6 },
      }}
    >
      <Box
        sx={{
          width: { sm: "100%", md: "60%" },
          textAlign: { sm: "left", md: "center" },
        }}
      >
        <Typography
          component="h1"
          variant="h6"
          color="text.secondary"
          style={{ fontStyle: "italic" }}
        >
          Interacting using {localStorage.getItem("email")}
        </Typography>
        <Typography component="h2" variant="h4" color="text.primary">
          Bat Guano Isolates Information System Genome Sequence
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The Bat Guano Isolates Information System is a comprehensive database
          that catalogs various bacterial isolates derived from bat fecal
          pellets collected at different cave sites in CALABARZON.
        </Typography>
      </Box>
      <Button variant="contained" onClick={handleAddOpen}>
        Add New Isolate
      </Button>
      <Dialog open={openAdd} onClose={handleAddClose}>
        <DialogTitle>Add New Isolate</DialogTitle>
        <DialogContent>
          <TextField
            name="isolate_code"
            label="Isolate Code"
            value={newIsolate.isolate_code}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="type_of_sample"
            label="Type of Sample"
            value={newIsolate.type_of_sample}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="bat_source"
            label="Bat Source"
            value={newIsolate.bat_source}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="sampling_site"
            label="Sampling Site"
            value={newIsolate.sampling_site}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            select
            name="gram_reaction"
            label="Gram Reaction"
            value={newIsolate.gram_reaction}
            onChange={handleChange}
            fullWidth
            margin="normal"
          >
            <MenuItem value="Gram-Positive">Gram-Positive</MenuItem>
            <MenuItem value="Gram-Negative">Gram-Negative</MenuItem>
          </TextField>
          <TextField
            name="cell_shape"
            label="Cell Shape"
            value={newIsolate.cell_shape}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="oxygen_requirement"
            label="Oxygen Requirement"
            value={newIsolate.oxygen_requirement}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            select
            name="presence_of_cytochrome_c_oxidase"
            label="Presence of Cytochrome c Oxidase"
            value={newIsolate.presence_of_cytochrome_c_oxidase}
            onChange={handleChange}
            fullWidth
            margin="normal"
          >
            <MenuItem value="Oxidase-Positive">Oxidase-Positive</MenuItem>
            <MenuItem value="Oxidase-Negative">Oxidase-Negative</MenuItem>
          </TextField>
          <TextField
            name="endospore_forming_capability"
            label="Endospore-Forming Capability"
            value={newIsolate.endospore_forming_capability}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="antibiotic_resistance_profile"
            label="Antibiotic Resistance Profile"
            value={newIsolate.antibiotic_resistance_profile}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="identity"
            label="Identity"
            value={newIsolate.identity}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="pathogenicity"
            label="Pathogenicity"
            value={newIsolate.pathogenicity}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <input
            accept=".fasta"
            id="gene_seq"
            type="file"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <label htmlFor="gene_seq">
            <Button variant="contained" component="span">
              Upload 16S rRNA (FASTA)
            </Button>
          </label>
          {fileName && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Uploaded file: {fileName}
            </Typography>
          )}
          <input
            accept="image/*"
            id="image_upload"
            type="file"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          <label htmlFor="image_upload">
            <Button variant="contained" component="span">
              Upload Image
            </Button>
          </label>
          {imageFileName && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Uploaded image: {imageFileName}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddSubmit} color="primary">
            Add Isolate
          </Button>
        </DialogActions>
      </Dialog>
      {dataset &&
        dataset.length > 0 && ( // Check if dataset is not empty
          <Grid container spacing={2}>
            {dataset.map((sample, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={index}
                sx={{ display: "flex" }}
              >
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    bgColor: "linear-gradient(45deg, #00e676, #76ff03)",

                    flexGrow: 1,
                    p: 1,
                  }}
                >
                  <CardContent>
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "flex-end", // Aligns the icon to the right
                        color: "darkgreen",
                      }}
                    >
                      {sampleAccessVerifier(sample.isolate_code) &&
                        isDatasetChanged && (
                          <DeleteIcon
                            style={{ cursor: "pointer" }}
                            onClick={() => handleDelete(sample.isolate_code)}
                          />
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        {sample.image_url ? (
                          <img
                            src={sample.image_url}
                            alt={sample.isolate_code}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "150px",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <ImageNotSupportedIcon
                            style={{ fontSize: "100px", color: "darkgreen" }}
                          />
                        )}
                      </div>
                    </Typography>
                  </CardContent>
                  <Box
                    sx={{
                      padding: "10px",
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor: "transparent",
                      justifyContent: "space-between",
                      pr: 2,
                      height: "100%", // Ensure the Box takes full height to allow justifyContent to work
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: "transparent",
                      }}
                    >
                      {/* Details in a column */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          bgcolor: "transparent",
                        }}
                      >
                        {/* Details in a column */}
                        <Typography variant="p bold" sx={{ textAlign: "left" }}>
                          Isolate Code
                          <span style={{ paddingLeft: "84px" }}>
                            {sample.isolate_code}
                          </span>
                        </Typography>
                        <br></br>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ textAlign: "left", fontWeight: "bold" }}
                          >
                            Type of Sample
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ paddingLeft: "64px" }}
                          >
                            {sample.type_of_sample}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="body1"
                            component="span"
                            sx={{ textAlign: "left", fontWeight: "bold" }}
                          >
                            Source
                          </Typography>
                          <Typography
                            variant="body1"
                            component="span"
                            sx={{ paddingLeft: "120px", fontStyle: "italic" }}
                          >
                            {sample.bat_source}
                          </Typography>
                        </Box>
                        <br></br>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <LocationOnIcon sx={{ color: "darkgreen" }} />
                          <Typography variant="p" sx={{ textAlign: "left" }}>
                            {sample.sampling_site}
                          </Typography>
                          {/* Add other components here to form additional columns */}
                        </Box>
                      </Box>
                    </Box>
                    {/* Action button at the bottom */}
                    <br></br>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        bgcolor: "transparent",
                      }}
                    >
                      <IconButton
                        aria-label="information"
                        onClick={() => handleClickOpen(sample)}
                      >
                        <img
                          src={`${process.env.PUBLIC_URL}/dna-svgrepo-com.svg`}
                          alt="rRNA"
                          style={{
                            width: "30px",
                            filter:
                              "invert(35%) sepia(100%) saturate(600%) hue-rotate(100deg) brightness(90%) contrast(88%)",
                          }}
                        />
                      </IconButton>

                      {sampleAccessVerifier(sample.isolate_code) && (
                        <IconButton
                          aria-label="share"
                          onClick={() => handleClickOpenShare(sample)}
                        >
                          <ShareIcon />
                        </IconButton>
                      )}

                      <Dialog open={openShare} onClose={handleCloseShare}>
                        <DialogTitle>Share to</DialogTitle>

                        <DialogContent>
                          <form>
                            <TextField
                              autoFocus
                              id="nameToSend"
                              label="Email Address"
                              type="email"
                              fullWidth
                              variant="standard"
                              value={emailAddressRecepient} // Bind state to TextField
                              onChange={handleEmailChange} // Update state on change
                            />
                          </form>
                        </DialogContent>

                        <DialogActions>
                          <IconButton
                            aria-label="send"
                            onClick={() => {
                              handleSending(sample.isolate_code);
                            }}
                          >
                            <SendIcon />
                          </IconButton>
                          <Button onClick={handleCloseShare}>Close</Button>
                        </DialogActions>
                      </Dialog>

                      <IconButton
                        aria-label="information"
                        onClick={() => handleClickOpenDetails(sample)}
                      >
                        <InfoIcon />
                      </IconButton>

                      <Dialog
                        open={open}
                        onClose={handleClose}
                        fullWidth
                        maxWidth="lg"
                      >
                        <DialogTitle>16S rRNA</DialogTitle>
                        <DialogContent>
                          {(() => {
                            const seq = (selectedIsolate?.gene_seq || "")
                              .replace(/[^ACGTacgt]/g, "")
                              .toUpperCase();
                            // console.log("Rendering SeqViz with sequence:", seq);

                            if (seq.length > 0) {
                              return (
                                <div style={{ width: "100%", height: 500 }}>
                                  <SeqViz
                                    name={
                                      selectedIsolate?.isolate_code ||
                                      "Sequence"
                                    }
                                    seq={seq}
                                    viewer="both"
                                    showComplement
                                    showIndex
                                    zoom="linear"
                                  />
                                </div>
                              );
                            } else {
                              return (
                                <DialogContentText>
                                  No gene sequence available
                                </DialogContentText>
                              );
                            }
                          })()}
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={handleClose}>Close</Button>
                        </DialogActions>
                      </Dialog>

                      <Dialog open={openDetails} onClose={handleCloseDetails}>
                        <DialogTitle>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography variant="h6">
                              Details of {selectedIsolate?.isolate_code}
                            </Typography>
                            {sampleAccessVerifier(sample.isolate_code) && (
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() =>
                                  handleClickOpenEdit(selectedIsolate)
                                }
                              >
                                Edit
                              </Button>
                            )}
                          </Box>
                        </DialogTitle>
                        <DialogContent style={{}}>
                          <div className="table-container">
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "50vh",
                              }}
                            >
                              {selectedIsolate?.image_url ? (
                                <img
                                  src={selectedIsolate?.image_url}
                                  alt={selectedIsolate?.isolate_code}
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: "250px",
                                    objectFit: "contain",
                                  }}
                                />
                              ) : (
                                <ImageNotSupportedIcon
                                  style={{
                                    fontSize: "250px",
                                    color: "darkgreen",
                                  }}
                                />
                              )}
                            </div>
                            <table className="data-table">
                              <tbody>
                                <tr>
                                  <td>Isolate Code</td>
                                  <td>{selectedIsolate?.isolate_code}</td>
                                </tr>
                                <tr>
                                  <td>Type of Sample</td>
                                  <td>{selectedIsolate?.type_of_sample}</td>
                                </tr>
                                <tr>
                                  <td>Bat Source</td>
                                  <td>{selectedIsolate?.bat_source}</td>
                                </tr>
                                <tr>
                                  <td>Sampling Site</td>
                                  <td>{selectedIsolate?.sampling_site}</td>
                                </tr>
                                <tr>
                                  <td>Gram reaction</td>
                                  <td>{selectedIsolate?.gram_reaction}</td>
                                </tr>
                                <tr>
                                  <td>Cell shape</td>
                                  <td>{selectedIsolate?.cell_shape}</td>
                                </tr>
                                <tr>
                                  <td>Oxygen requirement</td>
                                  <td>{selectedIsolate?.oxygen_requirement}</td>
                                </tr>
                                <tr>
                                  <td>Presence of cytochrome c oxidase</td>
                                  <td>
                                    {
                                      selectedIsolate?.presence_of_cytochrome_c_oxidase
                                    }
                                  </td>
                                </tr>
                                <tr>
                                  <td>Endospore-forming capability</td>
                                  <td>
                                    {
                                      selectedIsolate?.endospore_forming_capability
                                    }
                                  </td>
                                </tr>
                                <tr>
                                  <td>Antibiotic resistance profile</td>
                                  <td>
                                    {
                                      selectedIsolate?.antibiotic_resitance_profile
                                    }
                                  </td>
                                </tr>
                                <tr>
                                  <td>Identity</td>
                                  <td>{selectedIsolate?.identity}</td>
                                </tr>
                                <tr>
                                  <td>Pathogenicity</td>
                                  <td>{selectedIsolate?.pathogenicity}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={handleCloseDetails}>Close</Button>
                        </DialogActions>
                      </Dialog>
                      <Dialog open={openEdit} onClose={handleCloseEdit}>
                        <DialogTitle>Edit Isolate</DialogTitle>
                        <DialogContent>
                          <TextField
                            name="isolate_code"
                            label="Isolate Code"
                            value={editIsolate?.isolate_code || ""}
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                            disabled
                          />
                          <TextField
                            name="type_of_sample"
                            label="Type of Sample"
                            value={editIsolate?.type_of_sample || ""}
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          />
                          <TextField
                            name="bat_source"
                            label="Bat Source"
                            value={editIsolate?.bat_source || ""}
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          />
                          <TextField
                            name="sampling_site"
                            label="Sampling Site"
                            value={editIsolate?.sampling_site || ""}
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          />
                          <TextField
                            select
                            name="gram_reaction"
                            label="Gram Reaction"
                            value={editIsolate?.gram_reaction || ""}
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          >
                            <MenuItem value="Gram-Positive">
                              Gram-Positive
                            </MenuItem>
                            <MenuItem value="Gram-Negative">
                              Gram-Negative
                            </MenuItem>
                          </TextField>
                          <TextField
                            name="cell_shape"
                            label="Cell Shape"
                            value={editIsolate?.cell_shape || ""}
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          />
                          <TextField
                            name="oxygen_requirement"
                            label="Oxygen Requirement"
                            value={editIsolate?.oxygen_requirement || ""}
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          />
                          <TextField
                            select
                            name="presence_of_cytochrome_c_oxidase"
                            label="Presence of Cytochrome c Oxidase"
                            value={
                              editIsolate?.presence_of_cytochrome_c_oxidase ||
                              ""
                            }
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          >
                            <MenuItem value="Oxidase-Positive">
                              Oxidase-Positive
                            </MenuItem>
                            <MenuItem value="Oxidase-Negative">
                              Oxidase-Negative
                            </MenuItem>
                          </TextField>
                          <TextField
                            name="endospore_forming_capability"
                            label="Endospore-Forming Capability"
                            value={
                              editIsolate?.endospore_forming_capability || ""
                            }
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          />
                          <TextField
                            name="antibiotic_resistance_profile"
                            label="Antibiotic Resistance Profile"
                            value={
                              editIsolate?.antibiotic_resistance_profile || ""
                            }
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          />
                          <TextField
                            name="identity"
                            label="Identity"
                            value={editIsolate?.identity || ""}
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          />
                          <TextField
                            name="pathogenicity"
                            label="Pathogenicity"
                            value={editIsolate?.pathogenicity || ""}
                            onChange={handleChangeEdit}
                            fullWidth
                            margin="normal"
                          />
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={handleCloseEdit}>Cancel</Button>
                          <Button onClick={handleEditSubmit} color="primary">
                            Save
                          </Button>
                        </DialogActions>
                      </Dialog>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

 

    </Container>
  );
}
