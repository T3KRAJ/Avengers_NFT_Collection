export default function handler(req, res) {
  const tokenId = req.query.tokenId;
  const image_url =
    "https://raw.githubusercontent.com/T3KRAJ/Avengers_NFT_Collection/main/next_app/public/assets/";
  res.status(200).json({
    name: "Avengers NFT #" + tokenId,
    description: "Avengers NFT is a collection of avengers in crypto",
    image: image_url + tokenId + ".svg",
  });
}
